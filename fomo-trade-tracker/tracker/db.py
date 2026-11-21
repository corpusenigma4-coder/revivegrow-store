"""Persistencia en SQLite (un único archivo local)."""
from __future__ import annotations

import sqlite3
import threading
import time
from pathlib import Path
from typing import Any

SCHEMA = """
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS traders (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    display_name  TEXT NOT NULL,
    fomo_handle   TEXT,
    notes         TEXT,
    active        INTEGER NOT NULL DEFAULT 1,
    created_at    INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS wallets (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    trader_id      INTEGER NOT NULL REFERENCES traders(id) ON DELETE CASCADE,
    family         TEXT NOT NULL CHECK (family IN ('solana', 'evm')),
    address        TEXT NOT NULL,
    chains         TEXT NOT NULL,
    active         INTEGER NOT NULL DEFAULT 1,
    verification   TEXT NOT NULL DEFAULT 'unverified'
                   CHECK (verification IN ('unverified', 'declared', 'confirmed')),
    evidence_url   TEXT,
    evidence_note  TEXT,
    verified_at    INTEGER,
    created_at     INTEGER NOT NULL,
    UNIQUE (family, address)
);

CREATE TABLE IF NOT EXISTS cursors (
    key    TEXT PRIMARY KEY,
    value  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS trades (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    wallet_id          INTEGER NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    trader_id          INTEGER NOT NULL REFERENCES traders(id) ON DELETE CASCADE,
    chain              TEXT NOT NULL,
    tx_hash            TEXT NOT NULL,
    side               TEXT NOT NULL CHECK (side IN ('BUY', 'SELL', 'IN', 'OUT')),
    token_address      TEXT NOT NULL,
    token_symbol       TEXT,
    token_name         TEXT,
    token_decimals     INTEGER,
    token_amount       REAL NOT NULL,
    quote_symbol       TEXT,
    quote_address      TEXT,
    quote_amount       REAL,
    price_quote        REAL,
    price_usd          REAL,
    value_usd          REAL,
    usd_source         TEXT,
    position_after     REAL,
    pct_position_sold  REAL,
    liquidity_usd      REAL,
    market_cap         REAL,
    pair_url           TEXT,
    block_time         INTEGER,
    detected_at        INTEGER NOT NULL,
    is_backfill        INTEGER NOT NULL DEFAULT 0,
    notified           INTEGER NOT NULL DEFAULT 0,
    notes              TEXT,
    UNIQUE (chain, tx_hash, wallet_id, token_address, side)
);

CREATE INDEX IF NOT EXISTS idx_trades_time ON trades (block_time DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_trades_trader ON trades (trader_id, block_time DESC);
"""


class Database:
    def __init__(self, path: Path | str):
        if str(path) != ":memory:":
            Path(path).parent.mkdir(parents=True, exist_ok=True)
        self._conn = sqlite3.connect(str(path), check_same_thread=False, isolation_level=None)
        self._conn.row_factory = sqlite3.Row
        self._lock = threading.RLock()
        with self._lock:
            if str(path) != ":memory:":
                self._conn.execute("PRAGMA journal_mode=WAL")
            self._conn.executescript(SCHEMA)

    # ---- utilidades -------------------------------------------------
    def _all(self, sql: str, params: tuple | list = ()) -> list[dict]:
        with self._lock:
            return [dict(r) for r in self._conn.execute(sql, params).fetchall()]

    def _one(self, sql: str, params: tuple | list = ()) -> dict | None:
        with self._lock:
            row = self._conn.execute(sql, params).fetchone()
            return dict(row) if row else None

    def _exec(self, sql: str, params: tuple | list = ()) -> sqlite3.Cursor:
        with self._lock:
            return self._conn.execute(sql, params)

    # ---- traders ----------------------------------------------------
    def add_trader(self, display_name: str, fomo_handle: str | None, notes: str | None) -> int:
        cur = self._exec(
            "INSERT INTO traders (display_name, fomo_handle, notes, active, created_at) VALUES (?,?,?,1,?)",
            (display_name, fomo_handle, notes, int(time.time())),
        )
        return int(cur.lastrowid)

    def update_trader(self, trader_id: int, fields: dict[str, Any]) -> None:
        allowed = {"display_name", "fomo_handle", "notes", "active"}
        sets = {k: v for k, v in fields.items() if k in allowed}
        if not sets:
            return
        cols = ", ".join(f"{k} = ?" for k in sets)
        self._exec(f"UPDATE traders SET {cols} WHERE id = ?", (*sets.values(), trader_id))

    def delete_trader(self, trader_id: int) -> None:
        self._exec("DELETE FROM traders WHERE id = ?", (trader_id,))

    def get_trader(self, trader_id: int) -> dict | None:
        return self._one("SELECT * FROM traders WHERE id = ?", (trader_id,))

    def list_traders(self) -> list[dict]:
        traders = self._all("SELECT * FROM traders ORDER BY created_at")
        wallets = self._all("SELECT * FROM wallets ORDER BY created_at")
        stats = {
            r["trader_id"]: r
            for r in self._all(
                """SELECT trader_id,
                          SUM(side='BUY') AS buys, SUM(side='SELL') AS sells,
                          MAX(block_time) AS last_trade_at
                   FROM trades GROUP BY trader_id"""
            )
        }
        for t in traders:
            t["wallets"] = [w for w in wallets if w["trader_id"] == t["id"]]
            s = stats.get(t["id"], {})
            t["buys"] = s.get("buys") or 0
            t["sells"] = s.get("sells") or 0
            t["last_trade_at"] = s.get("last_trade_at")
        return traders

    # ---- wallets ----------------------------------------------------
    def add_wallet(self, trader_id: int, family: str, address: str, chains: list[str],
                   verification: str, evidence_url: str | None, evidence_note: str | None) -> int:
        now = int(time.time())
        cur = self._exec(
            """INSERT INTO wallets (trader_id, family, address, chains, active, verification,
                                    evidence_url, evidence_note, verified_at, created_at)
               VALUES (?,?,?,?,1,?,?,?,?,?)""",
            (trader_id, family, address, ",".join(chains), verification, evidence_url, evidence_note,
             now if verification != "unverified" else None, now),
        )
        return int(cur.lastrowid)

    def update_wallet(self, wallet_id: int, fields: dict[str, Any]) -> None:
        allowed = {"active", "verification", "evidence_url", "evidence_note", "chains"}
        sets = {k: v for k, v in fields.items() if k in allowed}
        if "chains" in sets and isinstance(sets["chains"], list):
            sets["chains"] = ",".join(sets["chains"])
        if "verification" in sets:
            sets["verified_at"] = int(time.time()) if sets["verification"] != "unverified" else None
        if not sets:
            return
        cols = ", ".join(f"{k} = ?" for k in sets)
        self._exec(f"UPDATE wallets SET {cols} WHERE id = ?", (*sets.values(), wallet_id))

    def delete_wallet(self, wallet_id: int) -> None:
        self._exec("DELETE FROM wallets WHERE id = ?", (wallet_id,))

    def get_wallet(self, wallet_id: int) -> dict | None:
        return self._one("SELECT * FROM wallets WHERE id = ?", (wallet_id,))

    def find_wallet(self, family: str, address: str) -> dict | None:
        return self._one("SELECT * FROM wallets WHERE family = ? AND address = ?", (family, address))

    def monitored_wallets(self, chain: str) -> list[dict]:
        """Wallets activas (y con trader activo) que deben vigilarse en `chain`."""
        rows = self._all(
            """SELECT w.*, t.display_name AS trader_name, t.fomo_handle
               FROM wallets w JOIN traders t ON t.id = w.trader_id
               WHERE w.active = 1 AND t.active = 1"""
        )
        return [w for w in rows if chain in w["chains"].split(",")]

    # ---- cursores ---------------------------------------------------
    def get_cursor(self, key: str) -> str | None:
        row = self._one("SELECT value FROM cursors WHERE key = ?", (key,))
        return row["value"] if row else None

    def set_cursor(self, key: str, value: str) -> None:
        self._exec("INSERT INTO cursors (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
                   (key, value))

    def delete_cursor(self, key: str) -> None:
        self._exec("DELETE FROM cursors WHERE key = ?", (key,))

    def delete_cursors_like(self, prefix: str) -> None:
        self._exec("DELETE FROM cursors WHERE key LIKE ?", (prefix + "%",))

    # ---- operaciones ------------------------------------------------
    TRADE_COLS = (
        "wallet_id", "trader_id", "chain", "tx_hash", "side", "token_address", "token_symbol", "token_name",
        "token_decimals", "token_amount", "quote_symbol", "quote_address", "quote_amount", "price_quote",
        "price_usd", "value_usd", "usd_source", "position_after", "pct_position_sold", "liquidity_usd",
        "market_cap", "pair_url", "block_time",
        "detected_at", "is_backfill", "notes",
    )

    def insert_trade(self, trade: dict) -> int | None:
        """Inserta si no existe. Devuelve el id nuevo, o None si era un duplicado."""
        values = [trade.get(c) for c in self.TRADE_COLS]
        cur = self._exec(
            f"INSERT OR IGNORE INTO trades ({', '.join(self.TRADE_COLS)}) VALUES ({', '.join('?' * len(self.TRADE_COLS))})",
            values,
        )
        return int(cur.lastrowid) if cur.rowcount == 1 else None

    def mark_notified(self, trade_id: int) -> None:
        self._exec("UPDATE trades SET notified = 1 WHERE id = ?", (trade_id,))

    _TRADE_SELECT = """
        SELECT tr.*, t.display_name AS trader_name, t.fomo_handle,
               w.address AS wallet_address, w.verification AS wallet_verification,
               w.evidence_url AS wallet_evidence_url
        FROM trades tr
        JOIN traders t ON t.id = tr.trader_id
        JOIN wallets w ON w.id = tr.wallet_id
    """

    def get_trade(self, trade_id: int) -> dict | None:
        return self._one(self._TRADE_SELECT + " WHERE tr.id = ?", (trade_id,))

    def list_trades(self, side: str | None = None, trader_id: int | None = None, chain: str | None = None,
                    before_id: int | None = None, limit: int = 50, include_transfers: bool = False,
                    wallet_id: int | None = None, before_time: int | None = None) -> list[dict]:
        """Operaciones en orden cronológico inverso (hora del bloque), paginadas por
        el par (before_time, before_id) de la última fila recibida."""
        where, params = [], []
        if wallet_id:
            where.append("tr.wallet_id = ?")
            params.append(wallet_id)
        if side == "XFER":
            where.append("tr.side IN ('IN', 'OUT')")
        elif side:
            where.append("tr.side = ?")
            params.append(side)
        elif not include_transfers:
            where.append("tr.side IN ('BUY', 'SELL')")
        if trader_id:
            where.append("tr.trader_id = ?")
            params.append(trader_id)
        if chain:
            where.append("tr.chain = ?")
            params.append(chain)
        if before_time is not None and before_id:
            where.append("(tr.block_time < ? OR (tr.block_time = ? AND tr.id < ?))")
            params.extend([before_time, before_time, before_id])
        elif before_id:
            where.append("tr.id < ?")
            params.append(before_id)
        sql = self._TRADE_SELECT
        if where:
            sql += " WHERE " + " AND ".join(where)
        sql += " ORDER BY tr.block_time DESC, tr.id DESC LIMIT ?"
        params.append(max(1, min(limit, 200)))
        return self._all(sql, params)

    def stats(self) -> dict:
        since = int(time.time()) - 86400
        row = self._one(
            """SELECT SUM(side='BUY' AND block_time >= ?) AS buys_24h,
                      SUM(side='SELL' AND block_time >= ?) AS sells_24h,
                      SUM(CASE WHEN side='BUY' AND block_time >= ? THEN value_usd END) AS buy_usd_24h,
                      SUM(CASE WHEN side='SELL' AND block_time >= ? THEN value_usd END) AS sell_usd_24h,
                      COUNT(*) AS total
               FROM trades""",
            (since, since, since, since),
        ) or {}
        counts = self._one(
            """SELECT (SELECT COUNT(*) FROM traders WHERE active = 1) AS active_traders,
                      (SELECT COUNT(*) FROM traders) AS traders,
                      (SELECT COUNT(*) FROM wallets w JOIN traders t ON t.id = w.trader_id
                        WHERE w.active = 1 AND t.active = 1) AS active_wallets,
                      (SELECT COUNT(*) FROM wallets WHERE verification = 'unverified') AS unverified_wallets"""
        ) or {}
        return {**{k: (v or 0) for k, v in row.items()}, **counts}
