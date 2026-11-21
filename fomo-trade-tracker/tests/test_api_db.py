"""Tests de base de datos y API HTTP (servidor local en un puerto libre, sin monitor activo)."""
from __future__ import annotations

import json
import threading
import time
import unittest
import urllib.error
import urllib.request

from helpers import ROOT  # noqa: F401  (añade el proyecto al path)

from tracker.db import Database
from tracker.monitor import EventBus, Monitor
from tracker.server import serve

SOL_ADDR = "73R2CY8TwH2gW16vcj1QUPJ1bC4i5jurrW44w6oNms9S"
EVM_ADDR = "0xDe81bd8d31708B799294096acA691598379f6632"


def trade_row(wallet_id, trader_id, **kw):
    base = dict(wallet_id=wallet_id, trader_id=trader_id, chain="solana", tx_hash="sig1", side="BUY",
                token_address="MintX", token_symbol="X", token_amount=10.0, quote_symbol="SOL", quote_amount=0.1,
                value_usd=6.5, usd_source="quote", block_time=int(time.time()), detected_at=int(time.time()),
                is_backfill=0)
    base.update(kw)
    return base


class DatabaseTest(unittest.TestCase):
    def setUp(self):
        self.db = Database(":memory:")
        self.tid = self.db.add_trader("Ana", "ana", None)
        self.wid = self.db.add_wallet(self.tid, "solana", SOL_ADDR, ["solana"], "unverified", None, None)

    def test_duplicate_trade_not_inserted_twice(self):
        self.assertIsNotNone(self.db.insert_trade(trade_row(self.wid, self.tid)))
        self.assertIsNone(self.db.insert_trade(trade_row(self.wid, self.tid)))
        self.assertEqual(len(self.db.list_trades()), 1)

    def test_filters_and_transfers(self):
        self.db.insert_trade(trade_row(self.wid, self.tid, tx_hash="a", side="BUY"))
        self.db.insert_trade(trade_row(self.wid, self.tid, tx_hash="b", side="SELL"))
        self.db.insert_trade(trade_row(self.wid, self.tid, tx_hash="c", side="IN"))
        self.assertEqual(len(self.db.list_trades()), 2)  # por defecto solo BUY/SELL
        self.assertEqual([t["side"] for t in self.db.list_trades(side="SELL")], ["SELL"])
        self.assertEqual([t["side"] for t in self.db.list_trades(side="XFER")], ["IN"])

    def test_history_is_chronological_with_pagination(self):
        now = int(time.time())
        # detectadas en otro orden que el del bloque (p. ej. historial cargado tarde)
        for tx, ago in (("t1", 60), ("t2", 600), ("t3", 30), ("t4", 300)):
            self.db.insert_trade(trade_row(self.wid, self.tid, tx_hash=tx, block_time=now - ago))
        page1 = self.db.list_trades(limit=2)
        self.assertEqual([t["tx_hash"] for t in page1], ["t3", "t1"])
        last = page1[-1]
        page2 = self.db.list_trades(limit=2, before_id=last["id"], before_time=last["block_time"])
        self.assertEqual([t["tx_hash"] for t in page2], ["t4", "t2"])

    def test_inactive_wallet_or_trader_not_monitored(self):
        self.assertEqual(len(self.db.monitored_wallets("solana")), 1)
        self.db.update_wallet(self.wid, {"active": 0})
        self.assertEqual(self.db.monitored_wallets("solana"), [])
        self.db.update_wallet(self.wid, {"active": 1})
        self.db.update_trader(self.tid, {"active": 0})
        self.assertEqual(self.db.monitored_wallets("solana"), [])

    def test_delete_trader_cascades(self):
        self.db.insert_trade(trade_row(self.wid, self.tid))
        self.db.delete_trader(self.tid)
        self.assertEqual(self.db.list_trades(), [])
        self.assertIsNone(self.db.get_wallet(self.wid))


class ApiTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.db = Database(":memory:")
        bus = EventBus()
        monitor = Monitor(cls.db, bus)  # no se arranca: sin acceso a red
        cls.httpd = serve("127.0.0.1", 0, cls.db, bus, monitor)
        cls.base = f"http://127.0.0.1:{cls.httpd.server_address[1]}"
        threading.Thread(target=cls.httpd.serve_forever, daemon=True).start()

    @classmethod
    def tearDownClass(cls):
        cls.httpd.shutdown()
        cls.httpd.server_close()

    def call(self, method, path, body=None):
        data = json.dumps(body).encode() if body is not None else None
        req = urllib.request.Request(self.base + path, data=data, method=method,
                                     headers={"content-type": "application/json"} if data else {})
        try:
            with urllib.request.urlopen(req, timeout=5) as r:
                return r.status, json.loads(r.read() or b"{}")
        except urllib.error.HTTPError as e:
            return e.code, json.loads(e.read() or b"{}")

    def test_trader_and_wallet_flow(self):
        st, data = self.call("POST", "/api/traders", {"display_name": "Trader Uno", "fomo_handle": "@trader_uno"})
        self.assertEqual(st, 201)
        tid = data["trader"]["id"]
        self.assertEqual(data["trader"]["fomo_handle"], "trader_uno")

        st, data = self.call("POST", f"/api/traders/{tid}/wallets", {"address": EVM_ADDR, "chains": ["base", "monad"]})
        self.assertEqual(st, 201)
        self.assertEqual(data["wallet"]["address"], EVM_ADDR.lower())
        self.assertEqual(data["wallet"]["verification"], "unverified")
        wid = data["wallet"]["id"]

        # Una wallet no puede pertenecer a dos traders
        st2, other = self.call("POST", "/api/traders", {"display_name": "Otro"})
        st, data = self.call("POST", f"/api/traders/{other['trader']['id']}/wallets", {"address": EVM_ADDR})
        self.assertEqual(st, 409)

        # Verificar sin evidencia -> rechazado; con evidencia -> aceptado
        st, data = self.call("PATCH", f"/api/wallets/{wid}", {"verification": "confirmed"})
        self.assertEqual(st, 400)
        st, data = self.call("PATCH", f"/api/wallets/{wid}", {"verification": "declared",
                                                             "evidence_url": "https://example.com/post"})
        self.assertEqual(st, 200)
        self.assertEqual(data["wallet"]["verification"], "declared")
        st, data = self.call("PATCH", f"/api/wallets/{wid}", {"verification": "declared",
                                                             "evidence_url": "javascript:alert(1)"})
        self.assertEqual(st, 400)

        st, data = self.call("PATCH", f"/api/traders/{tid}", {"active": False})
        self.assertEqual((st, data["trader"]["active"]), (200, 0))

    def test_validation_errors(self):
        st, _ = self.call("POST", "/api/traders", {"display_name": ""})
        self.assertEqual(st, 400)
        st, _ = self.call("POST", "/api/traders", {"display_name": "X", "fomo_handle": "bad handle!"})
        self.assertEqual(st, 400)
        st, data = self.call("POST", "/api/traders", {"display_name": "Y"})
        st, _ = self.call("POST", f"/api/traders/{data['trader']['id']}/wallets", {"address": "no-es-una-wallet"})
        self.assertEqual(st, 400)
        st, _ = self.call("POST", f"/api/traders/{data['trader']['id']}/wallets",
                          {"address": EVM_ADDR.replace("De81", "Aa81"), "chains": ["bitcoin"]})
        self.assertEqual(st, 400)
        st, _ = self.call("GET", "/api/trades?side=HOLD")
        self.assertEqual(st, 400)
        st, _ = self.call("GET", "/api/nada")
        self.assertEqual(st, 404)

    def test_static_and_traversal(self):
        with urllib.request.urlopen(self.base + "/", timeout=5) as r:
            self.assertEqual(r.status, 200)
            self.assertIn("default-src 'self'", r.headers["Content-Security-Policy"])
        for path in ("/../tracker/config.py", "/%2e%2e/run.py"):
            try:
                urllib.request.urlopen(self.base + path, timeout=5)
                self.fail("debería devolver 404")
            except urllib.error.HTTPError as e:
                self.assertEqual(e.code, 404)

    def test_status_endpoint(self):
        st, data = self.call("GET", "/api/status")
        self.assertEqual(st, 200)
        self.assertEqual(len(data["chains"]), 8)
        self.assertIn("unverified_wallets", data["stats"])


if __name__ == "__main__":
    unittest.main()
