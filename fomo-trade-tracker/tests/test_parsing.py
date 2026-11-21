"""Tests de lectura de transacciones reales (fixtures capturados de la red, sin modificar)."""
from __future__ import annotations

import unittest

from helpers import StubPrices, StubTokenReader, load_fixture

from tracker import evm, solana
from tracker.classify import classify
from tracker.config import CHAINS


def leg(legs, token):
    return next(l for l in legs if l["token"] == token)


class SolanaParsingTest(unittest.TestCase):
    def test_buy_real_tx(self):
        fx = load_fixture("solana_buy")
        legs = solana.wallet_legs(fx["tx"], fx["wallet"])
        tokens = [l for l in legs if l["token"] != "native"]
        self.assertEqual(len(tokens), 1)
        self.assertGreater(tokens[0]["delta"], 0)
        self.assertAlmostEqual(tokens[0]["delta"], 1107.564634, places=6)
        self.assertAlmostEqual(leg(legs, "native")["delta"], -0.011, places=9)

        mint = tokens[0]["token"]
        prices = StubPrices({mint: {"symbol": "FIONA", "name": "FIONA", "price_usd": 0.00065}},
                            native={"solana": 65.0})
        trades = classify("solana", legs, prices)
        self.assertEqual(len(trades), 1)
        t = trades[0]
        self.assertEqual(t["side"], "BUY")
        self.assertEqual(t["quote_symbol"], "SOL")
        self.assertAlmostEqual(t["quote_amount"], 0.011, places=9)
        self.assertAlmostEqual(t["value_usd"], 0.011 * 65.0, places=6)
        self.assertEqual(t["usd_source"], "quote")
        self.assertAlmostEqual(t["price_quote"], 0.011 / 1107.564634, places=12)

    def test_sell_real_tx_full_position(self):
        fx = load_fixture("solana_sell")
        legs = solana.wallet_legs(fx["tx"], fx["wallet"])
        token = next(l for l in legs if l["token"] != "native")
        self.assertAlmostEqual(token["delta"], -109184.225422, places=6)
        self.assertEqual(token["post_balance"], 0)
        # El SOL recibido incluye el rent devuelto al cerrar la cuenta de token.
        self.assertAlmostEqual(leg(legs, "native")["delta"], 0.346005254, places=9)

        prices = StubPrices({token["token"]: {"symbol": "CSI", "price_usd": 0.0002}}, native={"solana": 65.0})
        t = classify("solana", legs, prices)[0]
        self.assertEqual(t["side"], "SELL")
        self.assertEqual(t["pct_position_sold"], 100.0)
        self.assertEqual(t["quote_symbol"], "SOL")

    def test_other_wallet_has_no_legs(self):
        fx = load_fixture("solana_buy")
        self.assertEqual(solana.wallet_legs(fx["tx"], "11111111111111111111111111111111"), [])

    def test_failed_tx_ignored(self):
        fx = load_fixture("solana_buy")
        tx = {**fx["tx"], "meta": {**fx["tx"]["meta"], "err": {"InstructionError": [0, "Custom"]}}}
        self.assertEqual(solana.wallet_legs(tx, fx["wallet"]), [])


class EvmParsingTest(unittest.TestCase):
    def test_token_deltas_match_recorded(self):
        for name in ("bsc_buy_usdt", "elysium_buy_native", "arc_buy_usdc"):
            with self.subTest(name):
                fx = load_fixture(name)
                deltas = evm.wallet_token_deltas(fx, fx["wallet"])
                ignore = set(CHAINS[fx["chain"]].get("ignore_tokens", []))
                for lg in fx["recorded_legs"]:
                    if lg["token"] == "native":
                        continue
                    self.assertIn(lg["token"], deltas)
                    self.assertAlmostEqual(deltas[lg["token"]] / 10 ** lg["decimals"], lg["delta"], places=9)
                recorded = {lg["token"] for lg in fx["recorded_legs"]}
                self.assertEqual(set(deltas) - ignore, recorded - {"native"})

    def test_bsc_buy_with_usdt(self):
        fx = load_fixture("bsc_buy_usdt")
        legs = fx["recorded_legs"]
        asset = next(l for l in legs if l["token"] != "native" and l["delta"] > 0)
        trades = classify("bsc", legs, StubPrices({asset["token"]: {"symbol": "ARK", "price_usd": 6.4}}, native={"bsc": 600.0}))
        self.assertEqual(len(trades), 1)
        t = trades[0]
        self.assertEqual(t["side"], "BUY")
        self.assertEqual(t["quote_symbol"], "USDT")
        usdt = next(l for l in legs if l["token"] == "0x55d398326f99059ff775485246999027b3197955")
        self.assertAlmostEqual(t["value_usd"], -usdt["delta"], places=6)
        # El importe coincide con el de GeckoTerminal (fuente independiente) con < 1 % de diferencia.
        self.assertLess(abs(t["value_usd"] - float(fx["geckoterminal"]["volume_in_usd"])) / t["value_usd"], 0.01)

    def test_elysium_buy_with_native_hype(self):
        fx = load_fixture("elysium_buy_native")
        legs = fx["recorded_legs"]
        asset = next(l for l in legs if l["token"] != "native")
        trades = classify("elysium", legs, StubPrices({asset["token"]: {"symbol": "AGI", "price_usd": 0.00018}},
                                                      native={"elysium": 55.0}))
        t = trades[0]
        self.assertEqual(t["side"], "BUY")
        self.assertEqual(t["quote_symbol"], "HYPE")
        self.assertAlmostEqual(t["value_usd"], abs(leg(legs, "native")["delta"]) * 55.0, places=6)

    def test_arc_ignores_native_usdc_mirror(self):
        fx = load_fixture("arc_buy_usdc")
        reader = StubTokenReader({k: v for k, v in fx["token_meta"].items()})
        legs, diag = evm.wallet_legs(CHAINS["arc"], fx, fx["wallet"], reader, with_balances=False)
        self.assertEqual(diag["native_method"], "ignored")
        self.assertNotIn("0xfffffffffffffffffffffffffffffffffffffffe", {l["token"] for l in legs})
        asset = next(l for l in legs if l["delta"] > 0)
        t = classify("arc", legs, StubPrices({asset["token"]: {"symbol": "TOLLY", "price_usd": 0.00045}}))[0]
        self.assertEqual(t["side"], "BUY")
        self.assertEqual(t["quote_symbol"], "USDC")
        self.assertAlmostEqual(t["value_usd"], 3.0, places=6)

    def test_erc721_transfer_ignored(self):
        w = "0x" + "11" * 20
        bundle = {"receipt": {"logs": [{
            "address": "0x" + "22" * 20,
            "topics": [evm.TRANSFER_TOPIC, evm.pad_topic("0x" + "33" * 20), evm.pad_topic(w), "0x" + "0" * 63 + "1"],
            "data": "0x",
        }]}}
        self.assertEqual(evm.wallet_token_deltas(bundle, w), {})

    def test_address_helpers(self):
        a = "0xAbCdEf0123456789abcdef0123456789ABCDEF01"
        self.assertTrue(evm.is_evm_address(a))
        self.assertFalse(evm.is_evm_address("0x123"))
        self.assertEqual(evm.topic_to_address(evm.pad_topic(a)), a.lower())


if __name__ == "__main__":
    unittest.main()
