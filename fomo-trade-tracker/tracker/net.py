"""Cliente HTTP/JSON-RPC mínimo (solo biblioteca estándar).

- Limita la frecuencia por host para respetar los planes gratuitos.
- Reintenta con espera exponencial ante 429/5xx y errores de red.
"""
from __future__ import annotations

import json
import random
import threading
import time
import urllib.error
import urllib.parse
import urllib.request

from .config import USER_AGENT

# Intervalo mínimo entre peticiones por host (segundos).
_HOST_MIN_INTERVAL = {
    "api.geckoterminal.com": 2.1,  # 30 peticiones/min sin key
    "api.dexscreener.com": 0.25,   # 300 peticiones/min en endpoints de pares
    "api.mainnet-beta.solana.com": 0.12,
}
_DEFAULT_MIN_INTERVAL = 0.08

_locks: dict[str, threading.Lock] = {}
_last_call: dict[str, float] = {}
_global_lock = threading.Lock()


class RpcError(Exception):
    def __init__(self, message: str, code: int | None = None):
        super().__init__(message)
        self.code = code


def _throttle(host: str) -> None:
    with _global_lock:
        lock = _locks.setdefault(host, threading.Lock())
    with lock:
        min_iv = _HOST_MIN_INTERVAL.get(host, _DEFAULT_MIN_INTERVAL)
        wait = _last_call.get(host, 0) + min_iv - time.monotonic()
        if wait > 0:
            time.sleep(wait)
        _last_call[host] = time.monotonic()


def _request(url: str, body: bytes | None = None, timeout: float = 20.0, retries: int = 4):
    host = urllib.parse.urlparse(url).hostname or ""
    headers = {"accept": "application/json", "user-agent": USER_AGENT}
    if body is not None:
        headers["content-type"] = "application/json"
    last_exc: Exception | None = None
    for attempt in range(retries + 1):
        _throttle(host)
        req = urllib.request.Request(url, data=body, headers=headers, method="POST" if body is not None else "GET")
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            last_exc = e
            if e.code in (429, 500, 502, 503, 504) and attempt < retries:
                retry_after = e.headers.get("Retry-After") if e.headers else None
                delay = float(retry_after) if retry_after and retry_after.isdigit() else (1.5 * 2 ** attempt)
                time.sleep(min(delay, 30) + random.random() * 0.5)
                continue
            raise RpcError(f"HTTP {e.code} en {host}", e.code) from e
        except (urllib.error.URLError, TimeoutError, ConnectionError, json.JSONDecodeError) as e:
            last_exc = e
            if attempt < retries:
                time.sleep(1.0 * 2 ** attempt + random.random() * 0.5)
                continue
            raise RpcError(f"Error de red en {host}: {e}") from e
    raise RpcError(f"Fallo en {host}: {last_exc}")


def get_json(url: str, timeout: float = 20.0, retries: int = 3):
    return _request(url, None, timeout, retries)


def rpc_call(url: str, method: str, params: list, timeout: float = 25.0, retries: int = 4):
    payload = json.dumps({"jsonrpc": "2.0", "id": 1, "method": method, "params": params}).encode()
    data = _request(url, payload, timeout, retries)
    if isinstance(data, dict) and data.get("error"):
        err = data["error"]
        raise RpcError(f"{method}: {err.get('message', err)}", err.get("code"))
    return data.get("result") if isinstance(data, dict) else None


def rpc_batch(url: str, calls: list[tuple[str, list]], timeout: float = 30.0) -> list:
    """Batch JSON-RPC. Si el servidor no admite lotes, cae a llamadas individuales."""
    if not calls:
        return []
    payload = json.dumps([
        {"jsonrpc": "2.0", "id": i, "method": m, "params": p} for i, (m, p) in enumerate(calls)
    ]).encode()
    try:
        data = _request(url, payload, timeout, 3)
    except RpcError:
        data = None
    if isinstance(data, list) and len(data) == len(calls):
        out: list = [None] * len(calls)
        for item in data:
            idx = item.get("id")
            if isinstance(idx, int) and 0 <= idx < len(calls):
                out[idx] = item.get("result") if not item.get("error") else None
        if all(o is not None for o in out):
            return out
    # Respaldo: una a una
    return [rpc_call(url, m, p) for m, p in calls]
