"""Reglas de clasificación con casos sintéticos (datos de prueba construidos a mano,
no representan operaciones reales)."""
from __future__ import annotations

import unittest

from helpers import StubPrices

from tracker.classify import classify

USDC_SOL = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
TOKEN_A = "TokenAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
TOKEN_B = "TokenBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB"


def L(token, delta, post=None, dec=6):
    return {"token": token, "delta": delta, "decimals": dec, "post_balance": post}


class ClassifyRulesTest(unittest.TestCase):
    def setUp(self):
        self.prices = StubPrices({TOKEN_A: {"symbol": "AAA", "price_usd": 2.0},
                                  TOKEN_B: {"symbol": "BBB", "price_usd": 0.5}}, native={"solana": 100.0})

    def test_buy_with_usdc(self):
        t = classify("solana", [L(TOKEN_A, 10, 10), L(USDC_SOL, -21)], self.prices)[0]
        self.assertEqual((t["side"], t["quote_symbol"], t["value_usd"]), ("BUY", "USDC", 21))
        self.assertAlmostEqual(t["price_usd"], 2.1)

    def test_partial_sell_percentage(self):
        t = classify("solana", [L(TOKEN_A, -25, 75), L("native", 0.5, dec=9)], self.prices)[0]
        self.assertEqual(t["side"], "SELL")
        self.assertEqual(t["pct_position_sold"], 25.0)
        self.assertAlmostEqual(t["value_usd"], 50.0)

    def test_transfer_in_is_not_a_buy(self):
        t = classify("solana", [L(TOKEN_A, 100, 100)], self.prices)[0]
        self.assertEqual(t["side"], "IN")
        self.assertEqual(t["usd_source"], "market")

    def test_dust_quote_is_ignored(self):
        # 0,0001 SOL (0,01 $) de comisión/propina no convierte una transferencia en compra
        t = classify("solana", [L(TOKEN_A, 100, 100), L("native", -0.0001, dec=9)], self.prices)[0]
        self.assertEqual(t["side"], "IN")

    def test_token_to_token_swap(self):
        trades = classify("solana", [L(TOKEN_A, -5, 0), L(TOKEN_B, 20, 20)], self.prices)
        self.assertEqual(sorted(t["side"] for t in trades), ["BUY", "SELL"])
        self.assertTrue(all(t["usd_source"] == "market" for t in trades))

    def test_only_quote_movement_is_ignored(self):
        self.assertEqual(classify("solana", [L(USDC_SOL, -50), L("native", 0.5, dec=9)], self.prices), [])

    def test_fake_stablecoin_symbol_rejected(self):
        fake = "0x" + "aa" * 20
        token = "0x" + "bb" * 20
        prices = StubPrices({fake: {"symbol": "USDC", "price_usd": 0.2}, token: {"symbol": "TKN", "price_usd": 1.5}})
        trades = classify("monad", [L(fake, -10), L(token, 4)], prices)
        # No se acepta como pago porque el mercado no lo cotiza a ~1 $: queda como swap token→token.
        self.assertEqual(sorted(t["side"] for t in trades), ["BUY", "SELL"])

    def test_real_stablecoin_detected_dynamically(self):
        usdc = "0x" + "cc" * 20
        token = "0x" + "dd" * 20
        prices = StubPrices({usdc: {"symbol": "USDC", "price_usd": 1.0004}, token: {"symbol": "TKN", "price_usd": 1.5}})
        trades = classify("monad", [L(usdc, -6), L(token, 4)], prices)
        self.assertEqual(len(trades), 1)
        self.assertEqual((trades[0]["side"], trades[0]["quote_symbol"], trades[0]["value_usd"]), ("BUY", "USDC", 6))

    def test_unknown_token_flagged(self):
        t = classify("solana", [L("Unknown11111111111111111111111111111111111", 5, 5), L(USDC_SOL, -1)], self.prices)[0]
        self.assertEqual(t["side"], "BUY")
        self.assertIn("sin mercado conocido", t["notes"])


if __name__ == "__main__":
    unittest.main()
