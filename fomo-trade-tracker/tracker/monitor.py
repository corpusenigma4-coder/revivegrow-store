"""Bucle de monitoreo: un hilo por red, consulta periódica y emisión de eventos."""
from __future__ import annotations

import logging
import queue
import threading
import time

from . import evm, solana
from .classify import classify
from .config import CHAINS, NOTIFY_MAX_AGE_S, SOLANA_BACKFILL_TXS
from .db import Database
from .net import RpcError
from .prices import PriceService

log = logging.getLogger("tracker.monitor")

# Máximo de bloques a recuperar tras una desconexión (más allá se registra un hueco).
EVM_MAX_CATCHUP_CHUNKS = 40


class EventBus:
    """Difunde eventos a los clientes conectados por Server-Sent Events."""

    def __init__(self):
        self._subs: list[queue.Queue] = []
        self._lock = threading.Lock()

    def subscribe(self) -> queue.Queue:
        q: queue.Queue = queue.Queue(maxsize=500)
        with self._lock:
            self._subs.append(q)
        return q

    def unsubscribe(self, q: queue.Queue) -> None:
        with self._lock:
            if q in self._subs:
                self._subs.remove(q)

    def publish(self, event: dict) -> None:
        with self._lock:
            subs = list(self._subs)
        for q in subs:
            try:
                q.put_nowait(event)
            except queue.Full:
                pass


def present_trade(row: dict) -> dict:
    """Añade enlaces y etiquetas para la interfaz."""
    cfg = CHAINS.get(row["chain"], {})
    out = dict(row)
    out["chain_name"] = cfg.get("name", row["chain"])
    out["tx_url"] = cfg.get("explorer_tx", "{}").format(row["tx_hash"])
    if row.get("wallet_address"):
        out["wallet_url"] = cfg.get("explorer_address", "{}").format(row["wallet_address"])
    if row.get("token_address") and row["token_address"] != "native":
        out["token_url"] = cfg.get("explorer_address", "{}").format(row["token_address"])
    if row.get("block_time") and row.get("detected_at"):
        out["detection_delay_s"] = max(0, row["detected_at"] - row["block_time"])
    return out


class Monitor:
    def __init__(self, db: Database, bus: EventBus):
        self.db = db
        self.bus = bus
        self.prices = PriceService()
        self.tokens = evm.TokenReader()
        self._stop = threading.Event()
        self._threads: list[threading.Thread] = []
        self.status: dict[str, dict] = {
            key: {
                "chain": key, "name": cfg["name"], "family": cfg["family"],
                "state": "starting" if cfg["enabled"] else "disabled",
                "rpc_custom": cfg["rpc_is_custom"], "last_poll_at": None, "last_ok_at": None,
                "last_error": None, "hint": None, "latency_ms": None, "wallets": 0, "head": None,
            }
            for key, cfg in CHAINS.items()
        }
        self._status_lock = threading.Lock()

    # ---- ciclo de vida -------------------------------------------------
    def start(self) -> None:
        for key, cfg in CHAINS.items():
            if not cfg["enabled"]:
                continue
            t = threading.Thread(target=self._loop, args=(key,), name=f"monitor-{key}", daemon=True)
            t.start()
            self._threads.append(t)

    def stop(self) -> None:
        self._stop.set()

    def _set_status(self, chain: str, **fields) -> None:
        with self._status_lock:
            self.status[chain].update(fields)
            snapshot = dict(self.status[chain])
        self.bus.publish({"type": "status", "status": snapshot})

    def _loop(self, chain: str) -> None:
        cfg = CHAINS[chain]
        while not self._stop.is_set():
            t0 = time.time()
            try:
                if cfg["family"] == "solana":
                    n = self._poll_solana()
                else:
                    n = self._poll_evm(chain)
                state = "ok" if n else "idle"
                self._set_status(chain, state=state, last_poll_at=int(t0), last_ok_at=int(time.time()),
                                 last_error=None, hint=None, wallets=n, latency_ms=int((time.time() - t0) * 1000))
            except Exception as e:  # noqa: BLE001 - el monitor nunca debe morir
                msg = str(e)
                log.warning("[%s] %s", chain, msg)
                self._set_status(chain, state="error", last_poll_at=int(t0), last_error=msg[:300],
                                 hint=self._hint(chain, msg))
            elapsed = time.time() - t0
            self._stop.wait(max(1.0, cfg["poll_seconds"] - elapsed))

    @staticmethod
    def _hint(chain: str, msg: str) -> str | None:
        low = msg.lower()
        if "specify an address" in low or "limit exceeded" in low or ("eth_getlogs" in low and "not" in low):
            return (f"El RPC público de esta red no permite buscar transferencias por wallet. "
                    f"Define RPC_URL_{chain.upper()} con un proveedor RPC (muchos tienen plan gratuito con API key).")
        if "429" in low:
            return "Límite de peticiones del RPC público alcanzado; se reintentará automáticamente."
        if "403" in low:
            return "El RPC rechazó la petición (403). Si persiste, define un RPC propio con RPC_URL_" + chain.upper()
        return None

    # ---- Solana --------------------------------------------------------
    def _poll_solana(self) -> int:
        rpc = CHAINS["solana"]["rpc"]
        wallets = self.db.monitored_wallets("solana")
        for w in wallets:
            if self._stop.is_set():
                break
            key = f"sol:{w['id']}"
            cursor = self.db.get_cursor(key)
            backfill = cursor is None
            sigs = solana.get_new_signatures(rpc, w["address"], cursor or None,
                                             SOLANA_BACKFILL_TXS if backfill else 100)
            if not sigs:
                if backfill:
                    self.db.set_cursor(key, "")
                continue
            if backfill:
                # Historial inicial: un fallo puntual no debe bloquear ni convertir el
                # historial en alertas; el cursor se fija al final en la firma más reciente.
                for s in reversed(sigs):
                    if s.get("err") is not None:
                        continue
                    try:
                        tx = solana.get_transaction(rpc, s["signature"])
                    except RpcError as e:
                        log.info("[solana] historial: se omite %s (%s)", s["signature"][:12], e)
                        continue
                    if tx:
                        legs = solana.wallet_legs(tx, w["address"])
                        self._record("solana", w, s["signature"], legs, tx.get("blockTime"), True)
                self.db.set_cursor(key, sigs[0]["signature"])
                continue
            for s in reversed(sigs):  # orden cronológico
                sig = s["signature"]
                if s.get("err") is None:
                    tx = solana.get_transaction(rpc, sig)
                    if tx is None:
                        break  # aún no disponible: se reintenta en la próxima vuelta
                    legs = solana.wallet_legs(tx, w["address"])
                    self._record("solana", w, sig, legs, tx.get("blockTime"), False)
                self.db.set_cursor(key, sig)
        return len(wallets)

    # ---- EVM -----------------------------------------------------------
    def _poll_evm(self, chain: str) -> int:
        cfg = CHAINS[chain]
        rpc = cfg["rpc"]
        wallets = self.db.monitored_wallets(chain)
        if not wallets:
            return 0
        head = evm.block_number(rpc)
        self._set_status(chain, head=head)
        key = f"evm:{chain}"
        cur = self.db.get_cursor(key)
        start = int(cur) + 1 if cur else head - 2

        # Historial reciente para wallets recién añadidas (sin notificaciones).
        for w in wallets:
            bkey = f"evmbf:{w['id']}:{chain}"
            if self.db.get_cursor(bkey) is None:
                bf_from = max(0, head - cfg.get("backfill_blocks", 300))
                self._scan_range(chain, [w], bf_from, min(head, max(bf_from, start - 1)), backfill=True)
                self.db.set_cursor(bkey, str(head))

        max_catchup = EVM_MAX_CATCHUP_CHUNKS * cfg.get("max_block_range", 500)
        if head - start > max_catchup:
            log.warning("[%s] hueco de %d bloques; se salta al bloque %d", chain, head - start, head - max_catchup)
            start = head - max_catchup
        if start <= head:
            self._scan_range(chain, wallets, start, head, backfill=False)
            self.db.set_cursor(key, str(head))
        return len(wallets)

    def _scan_range(self, chain: str, wallets: list[dict], start: int, end: int, backfill: bool) -> None:
        cfg = CHAINS[chain]
        rpc = cfg["rpc"]
        by_addr = {w["address"].lower(): w for w in wallets}
        addrs = list(by_addr)
        step = cfg.get("max_block_range", 500)
        frm = start
        while frm <= end and not self._stop.is_set():
            to = min(end, frm + step - 1)
            try:
                logs = (evm.get_transfer_logs(rpc, frm, to, addrs, "from")
                        + evm.get_transfer_logs(rpc, frm, to, addrs, "to"))
            except RpcError as e:
                low = str(e).lower()
                if step > 1 and ("range" in low or "too many" in low or "10000" in low or "response size" in low):
                    step = max(1, step // 2)
                    continue
                raise
            # tx -> wallets implicadas, en orden de bloque
            pending: dict[str, set[str]] = {}
            order: list[tuple[int, int, str]] = []
            for lg in logs:
                tx_hash = lg["transactionHash"]
                involved = {evm.topic_to_address(lg["topics"][1]), evm.topic_to_address(lg["topics"][2])}
                hits = involved & set(addrs)
                if not hits:
                    continue
                if tx_hash not in pending:
                    pending[tx_hash] = set()
                    order.append((int(lg["blockNumber"], 16), int(lg.get("transactionIndex", "0x0"), 16), tx_hash))
                pending[tx_hash] |= hits
            for _, _, tx_hash in sorted(order):
                bundle = evm.fetch_tx_bundle(rpc, tx_hash)
                if not bundle.get("receipt"):
                    continue
                ts = int(bundle["block"]["timestamp"], 16) if bundle.get("block") else None
                for addr in pending[tx_hash]:
                    legs, _diag = evm.wallet_legs(cfg, bundle, addr, self.tokens)
                    self._record(chain, by_addr[addr], tx_hash, legs, ts, backfill)
            frm = to + 1

    # ---- registro y notificación ----------------------------------------
    def _record(self, chain: str, wallet: dict, tx_hash: str, legs: list[dict], block_time: int | None,
                backfill: bool) -> None:
        if not legs:
            return
        trades = classify(chain, legs, self.prices)
        now = int(time.time())
        for t in trades:
            row = {
                **t,
                "wallet_id": wallet["id"],
                "trader_id": wallet["trader_id"],
                "chain": chain,
                "tx_hash": tx_hash,
                "block_time": block_time or now,
                "detected_at": now,
                "is_backfill": 1 if backfill else 0,
            }
            trade_id = self.db.insert_trade(row)
            if trade_id is None:
                continue  # duplicado: ya registrado, no se vuelve a notificar
            notify = (not backfill and t["side"] in ("BUY", "SELL")
                      and now - (block_time or now) <= NOTIFY_MAX_AGE_S)
            if notify:
                self.db.mark_notified(trade_id)
            full = self.db.get_trade(trade_id)
            if full:
                self.bus.publish({"type": "trade", "notify": notify, "trade": present_trade(full)})

    def snapshot_status(self) -> list[dict]:
        with self._status_lock:
            return [dict(v) for v in self.status.values()]
