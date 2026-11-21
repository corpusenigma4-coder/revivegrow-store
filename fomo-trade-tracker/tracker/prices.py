"""Metadatos y precios de tokens desde DexScreener (principal) y GeckoTerminal (respaldo).

Los precios en USD son el precio de mercado en el momento de la detección; para
operaciones antiguas cargadas como historial el valor USD es aproximado.
"""
from __future__ import annotations

import threading
import time

from .config import CHAINS, SOLANA_WSOL
from .net import RpcError, get_json

PRICE_TTL = 45.0
INFO_TTL_MISS = 300.0


class PriceService:
    def __init__(self):
        self._cache: dict[tuple[str, str], tuple[float, dict | None]] = {}
        self._lock = threading.Lock()

    @staticmethod
    def _norm(chain: str, address: str) -> str:
        return address if CHAINS[chain]["family"] == "solana" else address.lower()

    def token_info(self, chain: str, address: str) -> dict | None:
        """Devuelve {symbol, name, price_usd, liquidity_usd, quote_addresses, pair_url, source} o None."""
        return self.token_infos(chain, [address]).get(self._norm(chain, address))

    def token_infos(self, chain: str, addresses: list[str]) -> dict[str, dict | None]:
        now = time.time()
        out: dict[str, dict | None] = {}
        missing: list[str] = []
        with self._lock:
            for a in {self._norm(chain, x) for x in addresses}:
                hit = self._cache.get((chain, a))
                if hit:
                    ts, info = hit
                    ttl = PRICE_TTL if info else INFO_TTL_MISS
                    if now - ts < ttl:
                        out[a] = info
                        continue
                missing.append(a)
        if missing:
            fetched = self._fetch_dexscreener(chain, missing)
            for a in missing:
                info = fetched.get(a)
                if info is None:
                    info = self._fetch_geckoterminal(chain, a)
                with self._lock:
                    prev = self._cache.get((chain, a))
                    # Si la consulta falla, conservar el último dato conocido.
                    if info is None and prev and prev[1]:
                        info = prev[1]
                    self._cache[(chain, a)] = (time.time(), info)
                out[a] = info
        return out

    def _fetch_dexscreener(self, chain: str, addresses: list[str]) -> dict[str, dict]:
        ds_chain = CHAINS[chain].get("dexscreener")
        if not ds_chain:
            return {}
        result: dict[str, dict] = {}
        for i in range(0, len(addresses), 30):
            chunk = addresses[i:i + 30]
            try:
                pairs = get_json(f"https://api.dexscreener.com/tokens/v1/{ds_chain}/{','.join(chunk)}")
            except RpcError:
                continue
            if not isinstance(pairs, list):
                continue
            for addr in chunk:
                info = self._best_from_pairs(chain, addr, pairs)
                if info:
                    result[addr] = info
        return result

    def _best_from_pairs(self, chain: str, addr: str, pairs: list[dict]) -> dict | None:
        """Elige el par más líquido donde aparece el token (como base o como quote).

        Como quote, su precio se deriva de priceUsd / priceNative del par.
        """
        best, best_liq, quotes = None, -1.0, set()
        for p in pairs:
            base = p.get("baseToken") or {}
            quote = p.get("quoteToken") or {}
            liq = float(((p.get("liquidity") or {}).get("usd")) or 0)
            try:
                price_base = float(p["priceUsd"]) if p.get("priceUsd") else None
                price_native = float(p["priceNative"]) if p.get("priceNative") else None
            except (TypeError, ValueError):
                price_base, price_native = None, None
            if self._norm(chain, base.get("address", "")) == addr:
                quotes.add(self._norm(chain, quote.get("address", "")))
                cand = (base, price_base, p.get("marketCap") or p.get("fdv"), True)
            elif self._norm(chain, quote.get("address", "")) == addr:
                price_q = price_base / price_native if price_base and price_native else None
                cand = (quote, price_q, None, False)
            else:
                continue
            if liq > best_liq:
                best, best_liq = (p, cand), liq
        if best is None:
            return None
        pair, (tok, price, mcap, is_base) = best
        return {
            "symbol": tok.get("symbol"),
            "name": tok.get("name"),
            "price_usd": price,
            "liquidity_usd": best_liq if best_liq >= 0 else None,
            "market_cap": mcap,
            "quote_addresses": sorted(quotes),
            "pair_url": pair.get("url"),
            "source": "dexscreener",
        }

    def _fetch_geckoterminal(self, chain: str, address: str) -> dict | None:
        net = CHAINS[chain].get("geckoterminal")
        if not net:
            return None
        try:
            data = get_json(f"https://api.geckoterminal.com/api/v2/networks/{net}/tokens/{address}", retries=1)
        except RpcError:
            return None
        attrs = ((data or {}).get("data") or {}).get("attributes") or {}
        if not attrs:
            return None
        try:
            price = float(attrs["price_usd"]) if attrs.get("price_usd") else None
        except (TypeError, ValueError):
            price = None
        return {
            "symbol": attrs.get("symbol"), "name": attrs.get("name"), "price_usd": price,
            "liquidity_usd": None, "market_cap": attrs.get("market_cap_usd") or attrs.get("fdv_usd"),
            "quote_addresses": [], "pair_url": None, "source": "geckoterminal",
        }

    def native_usd(self, chain: str) -> float | None:
        cfg = CHAINS[chain]
        if cfg["native_symbol"] in ("USDC", "USDT"):
            return 1.0
        ref = SOLANA_WSOL if cfg["family"] == "solana" else cfg.get("wrapped_native")
        if not ref:
            return None
        info = self.token_info(chain, ref)
        return info.get("price_usd") if info else None
