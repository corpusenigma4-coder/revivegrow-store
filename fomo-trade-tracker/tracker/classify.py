"""Convierte los cambios de saldo de una wallet en una transacción en operaciones BUY/SELL.

Regla general (independiente de la red):
  * El trader recibe un token y entrega una moneda de pago (SOL, USDC, WETH...) -> BUY
  * El trader entrega un token y recibe una moneda de pago                      -> SELL
  * Recibe/entrega un token sin contrapartida en la misma transacción           -> IN / OUT
    (transferencias, airdrops o la "pata" de una operación cross-chain; no se
    tratan como compra/venta para no inventar un precio).
  * Intercambio token -> token: SELL de uno y BUY del otro, valorados a precio de mercado.

Cada "pata" (leg) es un dict: {token, delta, decimals, post_balance}
  token        dirección del token, o "native" para la moneda nativa de la red
  delta        variación en unidades del token (positivo = entra en la wallet)
  post_balance saldo del token en la wallet tras la transacción (o None si se desconoce)
"""
from __future__ import annotations

from .config import CHAINS, SOLANA_QUOTES, SOLANA_WSOL
from .prices import PriceService

# Umbrales por debajo de los cuales un movimiento de moneda de pago se considera ruido
# (comisiones, propinas, rent residual).
MIN_QUOTE_USD = 0.05
MIN_NATIVE_FALLBACK = 0.0005

STABLE_SYMBOLS = {"USDC", "USDT", "USDT0", "USD₮0", "USD₮", "USDC.E", "USDBC", "AUSD", "USDE", "DAI", "USD1", "PYUSD", "FDUSD", "USDG"}


def _known_quote(chain: str, token: str) -> dict | None:
    cfg = CHAINS[chain]
    if token == "native":
        return {"symbol": cfg["native_symbol"], "stable": cfg["native_symbol"] in ("USDC", "USDT"), "native": True}
    if cfg["family"] == "solana":
        q = SOLANA_QUOTES.get(token)
        if q:
            return {**q, "native": token == SOLANA_WSOL}
        return None
    q = cfg.get("quotes", {}).get(token.lower())
    if q:
        return {**q, "native": token.lower() == (cfg.get("wrapped_native") or "").lower()}
    return None


def classify(chain: str, legs: list[dict], prices: PriceService) -> list[dict]:
    legs = [l for l in legs if l.get("delta")]
    if not legs:
        return []

    quote_legs, asset_legs = [], []
    for leg in legs:
        q = _known_quote(chain, leg["token"])
        if q:
            quote_legs.append({**leg, "quote": q})
        else:
            asset_legs.append(leg)
    if not asset_legs:
        return []  # solo movimientos de moneda de pago (depósito, retiro, wrap/unwrap)

    infos = prices.token_infos(chain, [l["token"] for l in asset_legs])
    norm = (lambda a: a) if CHAINS[chain]["family"] == "solana" else (lambda a: a.lower())

    # Stablecoins no listadas en la configuración (p. ej. USDC en Monad/Robinhood/Elysium):
    # se aceptan como moneda de pago solo si el símbolo es de una stablecoin conocida
    # Y el mercado la cotiza a ~1 USD (evita tokens falsos con símbolo "USDC").
    for leg in list(asset_legs):
        info = infos.get(norm(leg["token"])) or {}
        sym = (info.get("symbol") or leg.get("onchain_symbol") or "").upper()
        price = info.get("price_usd")
        if sym in STABLE_SYMBOLS and price and abs(price - 1) <= 0.03:
            quote_legs.append({**leg, "quote": {"symbol": sym, "stable": True, "native": False, "dynamic": True}})
            asset_legs.remove(leg)
    if not asset_legs:
        return []

    # Detección dinámica de moneda de pago en swaps token<->token de redes sin lista
    # fija: si B figura como quote en los pares de A (DexScreener), B actúa como pago.
    ins = [l for l in asset_legs if l["delta"] > 0]
    outs = [l for l in asset_legs if l["delta"] < 0]
    if not quote_legs and len(ins) == 1 and len(outs) == 1:
        a_in, a_out = ins[0], outs[0]
        info_in, info_out = infos.get(norm(a_in["token"])), infos.get(norm(a_out["token"]))
        if info_in and norm(a_out["token"]) in info_in.get("quote_addresses", []):
            quote_legs.append({**a_out, "quote": {"symbol": (info_out or {}).get("symbol") or "?", "stable": False,
                                                  "native": False, "dynamic": True}})
            asset_legs.remove(a_out)
        elif info_out and norm(a_in["token"]) in info_out.get("quote_addresses", []):
            quote_legs.append({**a_in, "quote": {"symbol": (info_in or {}).get("symbol") or "?", "stable": False,
                                                 "native": False, "dynamic": True}})
            asset_legs.remove(a_in)

    # Valor USD de la moneda de pago
    native_usd = prices.native_usd(chain) if any(q["quote"].get("native") for q in quote_legs) else None
    quote_usd_total = 0.0
    quote_usd_known = True
    by_symbol: dict[str, dict] = {}
    for q in quote_legs:
        meta = q["quote"]
        if meta.get("stable"):
            usd = q["delta"]
        elif meta.get("native"):
            usd = q["delta"] * native_usd if native_usd else None
        else:
            qi = prices.token_info(chain, q["token"])
            usd = q["delta"] * qi["price_usd"] if qi and qi.get("price_usd") else None
        if usd is None:
            quote_usd_known = False
        else:
            quote_usd_total += usd
        s = by_symbol.setdefault(meta["symbol"], {"amount": 0.0, "usd": 0.0, "address": q["token"]})
        s["amount"] += q["delta"]
        s["usd"] += usd or 0.0

    primary_symbol, primary = None, None
    if by_symbol:
        primary_symbol, primary = max(by_symbol.items(), key=lambda kv: abs(kv[1]["usd"]) or abs(kv[1]["amount"]))

    if quote_usd_known and quote_legs:
        significant = abs(quote_usd_total) >= MIN_QUOTE_USD
        quote_sign = (quote_usd_total > 0) - (quote_usd_total < 0)
    elif primary:
        significant = abs(primary["amount"]) >= MIN_NATIVE_FALLBACK
        quote_sign = (primary["amount"] > 0) - (primary["amount"] < 0)
    else:
        significant, quote_sign = False, 0

    ins = [l for l in asset_legs if l["delta"] > 0]
    outs = [l for l in asset_legs if l["delta"] < 0]
    trades: list[dict] = []

    def base_trade(leg: dict, side: str) -> dict:
        info = infos.get(norm(leg["token"])) or prices.token_info(chain, leg["token"]) or {}
        amount = abs(leg["delta"])
        t = {
            "side": side,
            "token_address": leg["token"],
            "token_symbol": info.get("symbol") or leg.get("onchain_symbol"),
            "token_name": info.get("name") or leg.get("onchain_name"),
            "token_decimals": leg.get("decimals"),
            "token_amount": amount,
            "quote_symbol": None, "quote_address": None, "quote_amount": None, "price_quote": None,
            "price_usd": None, "value_usd": None, "usd_source": None,
            "position_after": leg.get("post_balance"),
            "pct_position_sold": None,
            "notes": None,
            "market_price_usd": info.get("price_usd"),
            "liquidity_usd": info.get("liquidity_usd"),
            "market_cap": info.get("market_cap"),
            "pair_url": info.get("pair_url"),
        }
        if side in ("SELL", "OUT") and leg.get("post_balance") is not None:
            remaining = max(leg["post_balance"], 0.0)
            total = amount + remaining
            t["pct_position_sold"] = round(min(100.0, amount / total * 100), 2) if total > 0 else None
        if not info:
            t["notes"] = "Token sin mercado conocido en DexScreener/GeckoTerminal (posible spam o muy nuevo)."
        return t

    def apply_market(t: dict) -> None:
        if t["market_price_usd"]:
            t["price_usd"] = t["market_price_usd"]
            t["value_usd"] = t["token_amount"] * t["market_price_usd"]
            t["usd_source"] = "market"

    def apply_quote(t: dict) -> None:
        amount_q = abs(primary["amount"]) if primary else None
        t["quote_symbol"] = primary_symbol
        t["quote_address"] = primary["address"] if primary else None
        t["quote_amount"] = amount_q
        if amount_q and t["token_amount"]:
            t["price_quote"] = amount_q / t["token_amount"]
        if quote_usd_known and quote_legs:
            t["value_usd"] = abs(quote_usd_total)
            t["price_usd"] = t["value_usd"] / t["token_amount"] if t["token_amount"] else None
            t["usd_source"] = "quote"
        else:
            apply_market(t)

    if len(ins) == 1 and not outs and significant and quote_sign < 0:
        t = base_trade(ins[0], "BUY")
        apply_quote(t)
        trades.append(t)
    elif len(outs) == 1 and not ins and significant and quote_sign > 0:
        t = base_trade(outs[0], "SELL")
        apply_quote(t)
        trades.append(t)
    else:
        for leg in outs:
            side = "SELL" if (ins or (significant and quote_sign > 0)) else "OUT"
            t = base_trade(leg, side)
            apply_market(t)
            if side == "SELL":
                t["notes"] = (t["notes"] or "") + " Valor estimado a precio de mercado (swap múltiple o token→token)."
            trades.append(t)
        for leg in ins:
            side = "BUY" if (outs or (significant and quote_sign < 0)) else "IN"
            t = base_trade(leg, side)
            apply_market(t)
            if side == "BUY":
                t["notes"] = (t["notes"] or "") + " Valor estimado a precio de mercado (swap múltiple o token→token)."
            elif side == "IN":
                t["notes"] = (t["notes"] or "") + (" Entrada sin pago en la misma transacción: transferencia, "
                                                   "airdrop o posible compra cross-chain.")
            trades.append(t)
    for t in trades:
        if t["notes"]:
            t["notes"] = t["notes"].strip()
    return trades
