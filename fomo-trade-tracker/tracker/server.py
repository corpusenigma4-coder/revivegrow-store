"""Servidor HTTP local: API REST, Server-Sent Events y archivos de la interfaz."""
from __future__ import annotations

import json
import logging
import mimetypes
import queue
import re
import sqlite3
import time
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

from .config import CHAINS, EVM_CHAINS, NOTIFY_MAX_AGE_S, WEB_DIR
from .db import Database
from .evm import is_evm_address
from .monitor import EventBus, Monitor, present_trade

log = logging.getLogger("tracker.server")

SOLANA_ADDR_RE = re.compile(r"^[1-9A-HJ-NP-Za-km-z]{32,44}$")
HANDLE_RE = re.compile(r"^[A-Za-z0-9_.\-]{1,40}$")
VERIFICATION = ("unverified", "declared", "confirmed")
MAX_BODY = 32 * 1024


class ApiError(Exception):
    def __init__(self, status: int, message: str):
        super().__init__(message)
        self.status = status
        self.message = message


def _clean_text(value, field: str, max_len: int, required: bool = False) -> str | None:
    if value is None or (isinstance(value, str) and not value.strip()):
        if required:
            raise ApiError(400, f"El campo '{field}' es obligatorio.")
        return None
    if not isinstance(value, str):
        raise ApiError(400, f"El campo '{field}' debe ser texto.")
    value = value.strip()
    if len(value) > max_len:
        raise ApiError(400, f"El campo '{field}' admite como máximo {max_len} caracteres.")
    return value


def _validate_evidence(data: dict, verification: str) -> tuple[str | None, str | None]:
    url = _clean_text(data.get("evidence_url"), "evidence_url", 500)
    note = _clean_text(data.get("evidence_note"), "evidence_note", 1000)
    if url and not url.startswith("https://"):
        raise ApiError(400, "El enlace de evidencia debe empezar por https://")
    if verification != "unverified" and not (url or note):
        raise ApiError(400, "Para marcar una wallet como declarada o confirmada indica la evidencia "
                            "(enlace público donde el trader la publica y/o nota de la comprobación).")
    return url, note


def make_handler(db: Database, bus: EventBus, monitor: Monitor):
    class Handler(BaseHTTPRequestHandler):
        server_version = "FomoTradeTracker/0.1"
        protocol_version = "HTTP/1.1"

        def log_message(self, fmt, *args):  # silenciar el log por petición
            log.debug("%s - %s", self.address_string(), fmt % args)

        # ---- utilidades de respuesta ----
        def _send_json(self, status: int, payload) -> None:
            body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(body)

        def _read_json(self) -> dict:
            length = int(self.headers.get("Content-Length") or 0)
            if length > MAX_BODY:
                raise ApiError(413, "Cuerpo de la petición demasiado grande.")
            raw = self.rfile.read(length) if length else b"{}"
            try:
                data = json.loads(raw.decode("utf-8") or "{}")
            except (UnicodeDecodeError, json.JSONDecodeError):
                raise ApiError(400, "JSON no válido.") from None
            if not isinstance(data, dict):
                raise ApiError(400, "Se esperaba un objeto JSON.")
            return data

        def _route(self, method: str) -> None:
            url = urlparse(self.path)
            parts = [p for p in url.path.split("/") if p]
            try:
                if parts[:1] == ["api"]:
                    self._api(method, parts[1:], parse_qs(url.query))
                elif method == "GET":
                    self._static(url.path)
                else:
                    raise ApiError(404, "No encontrado.")
            except ApiError as e:
                self._send_json(e.status, {"error": e.message})
            except (BrokenPipeError, ConnectionResetError):
                pass
            except Exception:  # noqa: BLE001
                log.exception("Error no controlado en %s %s", method, self.path)
                try:
                    self._send_json(500, {"error": "Error interno del servidor."})
                except Exception:  # noqa: BLE001
                    pass

        def do_GET(self):
            self._route("GET")

        def do_POST(self):
            self._route("POST")

        def do_PATCH(self):
            self._route("PATCH")

        def do_DELETE(self):
            self._route("DELETE")

        # ---- archivos estáticos ----
        def _static(self, path: str) -> None:
            rel = "index.html" if path in ("", "/") else path.lstrip("/")
            target = (WEB_DIR / rel).resolve()
            if WEB_DIR.resolve() not in target.parents or not target.is_file():
                raise ApiError(404, "No encontrado.")
            body = target.read_bytes()
            ctype = mimetypes.guess_type(target.name)[0] or "application/octet-stream"
            if ctype.startswith("text/") or ctype in ("application/javascript",):
                ctype += "; charset=utf-8"
            self.send_response(200)
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-cache")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.send_header("Content-Security-Policy",
                             "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; "
                             "connect-src 'self'; frame-ancestors 'none'")
            self.end_headers()
            self.wfile.write(body)

        # ---- API ----
        def _api(self, method: str, parts: list[str], qs: dict) -> None:
            def q(name: str) -> str | None:
                v = qs.get(name)
                return v[0] if v else None

            def int_or_none(v):
                try:
                    return int(v) if v not in (None, "") else None
                except ValueError:
                    raise ApiError(400, f"Valor numérico no válido: {v}") from None

            # /api/events (SSE)
            if parts == ["events"] and method == "GET":
                return self._sse()

            if parts == ["config"] and method == "GET":
                return self._send_json(200, {
                    "chains": [{"key": k, "name": c["name"], "family": c["family"]} for k, c in CHAINS.items()],
                    "evm_chains": EVM_CHAINS,
                    "notify_max_age_s": NOTIFY_MAX_AGE_S,
                })

            if parts == ["status"] and method == "GET":
                return self._send_json(200, {"chains": monitor.snapshot_status(), "stats": db.stats(),
                                             "server_time": int(time.time())})

            # traders
            if parts == ["traders"]:
                if method == "GET":
                    return self._send_json(200, {"traders": db.list_traders()})
                if method == "POST":
                    data = self._read_json()
                    name = _clean_text(data.get("display_name"), "display_name", 60, required=True)
                    handle = _clean_text(data.get("fomo_handle"), "fomo_handle", 41)
                    if handle:
                        handle = handle.lstrip("@")
                        if not HANDLE_RE.match(handle):
                            raise ApiError(400, "Usuario de FOMO no válido (letras, números, _ . -).")
                    notes = _clean_text(data.get("notes"), "notes", 1000)
                    tid = db.add_trader(name, handle, notes)
                    return self._send_json(201, {"trader": db.get_trader(tid)})
            if len(parts) == 2 and parts[0] == "traders":
                tid = int_or_none(parts[1])
                if not tid or not db.get_trader(tid):
                    raise ApiError(404, "Trader no encontrado.")
                if method == "PATCH":
                    data = self._read_json()
                    fields = {}
                    if "display_name" in data:
                        fields["display_name"] = _clean_text(data["display_name"], "display_name", 60, required=True)
                    if "fomo_handle" in data:
                        h = _clean_text(data["fomo_handle"], "fomo_handle", 41)
                        if h:
                            h = h.lstrip("@")
                            if not HANDLE_RE.match(h):
                                raise ApiError(400, "Usuario de FOMO no válido.")
                        fields["fomo_handle"] = h
                    if "notes" in data:
                        fields["notes"] = _clean_text(data["notes"], "notes", 1000)
                    if "active" in data:
                        fields["active"] = 1 if data["active"] else 0
                    db.update_trader(tid, fields)
                    return self._send_json(200, {"trader": db.get_trader(tid)})
                if method == "DELETE":
                    db.delete_trader(tid)
                    return self._send_json(200, {"ok": True})
            if len(parts) == 3 and parts[0] == "traders" and parts[2] == "wallets" and method == "POST":
                tid = int_or_none(parts[1])
                if not tid or not db.get_trader(tid):
                    raise ApiError(404, "Trader no encontrado.")
                data = self._read_json()
                address = _clean_text(data.get("address"), "address", 64, required=True)
                if SOLANA_ADDR_RE.match(address):
                    family, chains = "solana", ["solana"]
                elif is_evm_address(address):
                    family = "evm"
                    address = address.lower()
                    chains = data.get("chains") or EVM_CHAINS
                    if not isinstance(chains, list) or not chains or any(c not in EVM_CHAINS for c in chains):
                        raise ApiError(400, "Lista de redes EVM no válida.")
                else:
                    raise ApiError(400, "Dirección no válida: debe ser una dirección Solana (base58) "
                                        "o EVM (0x + 40 caracteres hexadecimales).")
                verification = data.get("verification") or "unverified"
                if verification not in VERIFICATION:
                    raise ApiError(400, "Estado de verificación no válido.")
                ev_url, ev_note = _validate_evidence(data, verification)
                existing = db.find_wallet(family, address)
                if existing:
                    owner = db.get_trader(existing["trader_id"])
                    raise ApiError(409, f"Esta wallet ya está asignada a «{owner['display_name'] if owner else '?'}». "
                                        "Una wallet solo puede pertenecer a un trader.")
                try:
                    wid = db.add_wallet(tid, family, address, chains, verification, ev_url, ev_note)
                except sqlite3.IntegrityError:
                    raise ApiError(409, "Wallet duplicada.") from None
                return self._send_json(201, {"wallet": db.get_wallet(wid)})

            # wallets
            if len(parts) == 2 and parts[0] == "wallets":
                wid = int_or_none(parts[1])
                wallet = db.get_wallet(wid) if wid else None
                if not wallet:
                    raise ApiError(404, "Wallet no encontrada.")
                if method == "PATCH":
                    data = self._read_json()
                    fields: dict = {}
                    if "active" in data:
                        fields["active"] = 1 if data["active"] else 0
                    if "verification" in data:
                        if data["verification"] not in VERIFICATION:
                            raise ApiError(400, "Estado de verificación no válido.")
                        fields["verification"] = data["verification"]
                        fields["evidence_url"], fields["evidence_note"] = _validate_evidence(data, data["verification"])
                    if "chains" in data:
                        chains = data["chains"]
                        if wallet["family"] != "evm" or not isinstance(chains, list) or not chains \
                                or any(c not in EVM_CHAINS for c in chains):
                            raise ApiError(400, "Lista de redes no válida.")
                        fields["chains"] = chains
                    db.update_wallet(wid, fields)
                    return self._send_json(200, {"wallet": db.get_wallet(wid)})
                if method == "DELETE":
                    db.delete_wallet(wid)
                    db.delete_cursor(f"sol:{wid}")
                    db.delete_cursors_like(f"evmbf:{wid}:")
                    return self._send_json(200, {"ok": True})

            # trades
            if parts == ["trades"] and method == "GET":
                side = q("side")
                if side and side not in ("BUY", "SELL", "IN", "OUT", "XFER"):
                    raise ApiError(400, "Filtro de tipo no válido.")
                chain = q("chain")
                if chain and chain not in CHAINS:
                    raise ApiError(400, "Red no válida.")
                rows = db.list_trades(
                    side=side, trader_id=int_or_none(q("trader_id")), chain=chain,
                    before_id=int_or_none(q("before_id")), limit=int_or_none(q("limit")) or 50,
                    include_transfers=q("transfers") == "1", wallet_id=int_or_none(q("wallet_id")),
                    before_time=int_or_none(q("before_time")),
                )
                return self._send_json(200, {"trades": [present_trade(r) for r in rows]})
            if len(parts) == 2 and parts[0] == "trades" and method == "GET":
                row = db.get_trade(int_or_none(parts[1]) or 0)
                if not row:
                    raise ApiError(404, "Operación no encontrada.")
                return self._send_json(200, {"trade": present_trade(row)})

            raise ApiError(404, "Ruta de API no encontrada.")

        def _sse(self) -> None:
            self.send_response(200)
            self.send_header("Content-Type", "text/event-stream; charset=utf-8")
            self.send_header("Cache-Control", "no-store")
            self.send_header("Connection", "keep-alive")
            self.send_header("X-Accel-Buffering", "no")
            self.end_headers()
            sub = bus.subscribe()
            try:
                self.wfile.write(b"retry: 3000\n\n")
                self.wfile.flush()
                while True:
                    try:
                        ev = sub.get(timeout=15)
                        data = json.dumps(ev, ensure_ascii=False)
                        self.wfile.write(f"event: {ev['type']}\ndata: {data}\n\n".encode("utf-8"))
                    except queue.Empty:
                        self.wfile.write(b": ping\n\n")
                    self.wfile.flush()
            except (BrokenPipeError, ConnectionResetError, OSError):
                pass
            finally:
                bus.unsubscribe(sub)
                self.close_connection = True

    return Handler


def serve(host: str, port: int, db: Database, bus: EventBus, monitor: Monitor) -> ThreadingHTTPServer:
    httpd = ThreadingHTTPServer((host, port), make_handler(db, bus, monitor))
    httpd.daemon_threads = True
    return httpd


__all__ = ["serve", "HTTPStatus"]
