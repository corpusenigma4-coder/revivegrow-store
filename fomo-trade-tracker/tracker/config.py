"""Configuración de redes y parámetros del monitor.

Todos los valores de RPC y chain ID de esta tabla se comprobaron en vivo
(eth_chainId / getHealth) el 2026-11-21. Las URLs de exploradores proceden de
documentación pública y fuentes de terceros; se pueden cambiar sin tocar código.

Cualquier RPC se puede sustituir con una variable de entorno
RPC_URL_<RED>, por ejemplo RPC_URL_SOLANA o RPC_URL_BSC (útil para usar un
proveedor con API key gratuita y límites más altos).
"""
from __future__ import annotations

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = Path(os.environ.get("FTT_DATA_DIR", BASE_DIR / "data"))
DB_PATH = Path(os.environ.get("FTT_DB_PATH", DATA_DIR / "tracker.db"))
WEB_DIR = BASE_DIR / "web"

HOST = os.environ.get("FTT_HOST", "127.0.0.1")
PORT = int(os.environ.get("FTT_PORT", "8787"))

# Solo se notifican operaciones detectadas con menos de esta antigüedad
# (evita una avalancha de alertas al arrancar o tras una desconexión).
NOTIFY_MAX_AGE_S = int(os.environ.get("FTT_NOTIFY_MAX_AGE_S", "300"))
# Número de transacciones previas que se cargan como historial al añadir una wallet Solana.
SOLANA_BACKFILL_TXS = int(os.environ.get("FTT_SOLANA_BACKFILL", "25"))

USER_AGENT = "fomo-trade-tracker/0.1 (read-only monitor)"

# Direcciones de tokens "moneda de pago" (quote) bien conocidas.
# Solo se incluyen direcciones canónicas ampliamente documentadas. En las redes
# donde no se listan, el tracker detecta la moneda de pago dinámicamente
# consultando en DexScreener/GeckoTerminal qué token actúa como quote del par.
SOLANA_WSOL = "So11111111111111111111111111111111111111112"
SOLANA_QUOTES = {
    SOLANA_WSOL: {"symbol": "SOL", "stable": False},
    "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v": {"symbol": "USDC", "stable": True},
    "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB": {"symbol": "USDT", "stable": True},
}

CHAINS: dict[str, dict] = {
    "solana": {
        "name": "Solana",
        "family": "solana",
        "rpc": "https://api.mainnet-beta.solana.com",
        "native_symbol": "SOL",
        "native_decimals": 9,
        "explorer_tx": "https://solscan.io/tx/{}",
        "explorer_address": "https://solscan.io/account/{}",
        "dexscreener": "solana",
        "geckoterminal": "solana",
        "poll_seconds": 6,
    },
    "base": {
        "name": "Base",
        "family": "evm",
        "chain_id": 8453,
        "rpc": "https://mainnet.base.org",
        "native_symbol": "ETH",
        "native_decimals": 18,
        "wrapped_native": "0x4200000000000000000000000000000000000006",
        "quotes": {
            "0x4200000000000000000000000000000000000006": {"symbol": "WETH", "stable": False},
            "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913": {"symbol": "USDC", "stable": True},
        },
        "explorer_tx": "https://basescan.org/tx/{}",
        "explorer_address": "https://basescan.org/address/{}",
        "dexscreener": "base",
        "geckoterminal": "base",
        "max_block_range": 500,
        "backfill_blocks": 300,
        "poll_seconds": 15,
    },
    "bsc": {
        "name": "BNB Chain",
        "family": "evm",
        "chain_id": 56,
        "rpc": "https://bsc-dataseed.bnbchain.org",
        "native_symbol": "BNB",
        "native_decimals": 18,
        "wrapped_native": "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c",
        "quotes": {
            "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c": {"symbol": "WBNB", "stable": False},
            "0x55d398326f99059ff775485246999027b3197955": {"symbol": "USDT", "stable": True},
            "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d": {"symbol": "USDC", "stable": True},
        },
        "explorer_tx": "https://bscscan.com/tx/{}",
        "explorer_address": "https://bscscan.com/address/{}",
        "dexscreener": "bsc",
        "geckoterminal": "bsc",
        "max_block_range": 500,
        "backfill_blocks": 800,
        "poll_seconds": 10,
    },
    "ethereum": {
        "name": "Ethereum",
        "family": "evm",
        "chain_id": 1,
        "rpc": "https://ethereum-rpc.publicnode.com",
        "native_symbol": "ETH",
        "native_decimals": 18,
        "wrapped_native": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
        "quotes": {
            "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2": {"symbol": "WETH", "stable": False},
            "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": {"symbol": "USDC", "stable": True},
            "0xdac17f958d2ee523a2206206994597c13d831ec7": {"symbol": "USDT", "stable": True},
        },
        "explorer_tx": "https://etherscan.io/tx/{}",
        "explorer_address": "https://etherscan.io/address/{}",
        "dexscreener": "ethereum",
        "geckoterminal": "eth",
        "max_block_range": 500,
        "backfill_blocks": 50,
        "poll_seconds": 12,
    },
    "monad": {
        "name": "Monad",
        "family": "evm",
        "chain_id": 143,
        "rpc": "https://rpc.monad.xyz",
        "native_symbol": "MON",
        "native_decimals": 18,
        # Verificado en GeckoTerminal ("Wrapped MON", coingecko id wrapped-monad).
        "wrapped_native": "0x3bd359c1119da7da1d913d1c4d2b7c461115433a",
        "quotes": {
            "0x3bd359c1119da7da1d913d1c4d2b7c461115433a": {"symbol": "WMON", "stable": False},
        },
        "explorer_tx": "https://monadscan.com/tx/{}",
        "explorer_address": "https://monadscan.com/address/{}",
        "dexscreener": "monad",
        "geckoterminal": "monad",
        "max_block_range": 100,  # el RPC público rechaza rangos de 1000 bloques
        "backfill_blocks": 1500,
        "poll_seconds": 8,
    },
    "robinhood": {
        "name": "Robinhood Chain",
        "family": "evm",
        "chain_id": 4663,
        "rpc": "https://rpc.mainnet.chain.robinhood.com",
        "native_symbol": "ETH",
        "native_decimals": 18,
        # Verificados on-chain (symbol/name) y en GeckoTerminal (ids de CoinGecko
        # robinhood-wrapped-eth-robinhood-chain y global-dollar).
        "wrapped_native": "0x0bd7d308f8e1639fab988df18a8011f41eacad73",
        "quotes": {
            "0x0bd7d308f8e1639fab988df18a8011f41eacad73": {"symbol": "WETH", "stable": False},
            "0x5fc5360d0400a0fd4f2af552add042d716f1d168": {"symbol": "USDG", "stable": True},
        },
        "explorer_tx": "https://robinhoodchain.blockscout.com/tx/{}",
        "explorer_address": "https://robinhoodchain.blockscout.com/address/{}",
        "dexscreener": "robinhood",
        "geckoterminal": "robinhood",
        "max_block_range": 1000,
        "backfill_blocks": 2000,
        "poll_seconds": 10,
    },
    "arc": {
        "name": "Arc",
        "family": "evm",
        "chain_id": 5042,
        "rpc": "https://rpc.mainnet.arc.io",
        "native_symbol": "USDC",
        "native_decimals": 18,
        # En Arc el USDC es a la vez gas nativo (18 decimales) y token ERC-20
        # (0x3600…0000, 6 decimales, verificado on-chain). Cada movimiento emite un
        # Transfer en el ERC-20 y otro "espejo" desde 0xffff…fffe: se usa solo el
        # ERC-20 y se ignora el saldo nativo para no contar dos veces.
        "native_mode": "none",
        "ignore_tokens": ["0xfffffffffffffffffffffffffffffffffffffffe"],
        "quotes": {
            "0x3600000000000000000000000000000000000000": {"symbol": "USDC", "stable": True},
        },
        "explorer_tx": "https://explorer.arc.io/tx/{}",
        "explorer_address": "https://explorer.arc.io/address/{}",
        "dexscreener": "arc",
        "geckoterminal": "arc",
        "max_block_range": 1000,
        "backfill_blocks": 1000,
        "poll_seconds": 10,
    },
    "elysium": {
        "name": "Elysium",
        "family": "evm",
        "chain_id": 99901,
        "rpc": "https://rpc.elysium.kinetiq.xyz",
        "native_symbol": "HYPE",
        "native_decimals": 18,
        # Verificados on-chain y en GeckoTerminal (kinetiq-wrapped-hype, usd-coin).
        "wrapped_native": "0xba876237b0f021a6c6d852d6c26e107997cc5e81",
        "quotes": {
            "0xba876237b0f021a6c6d852d6c26e107997cc5e81": {"symbol": "WHYPE", "stable": False},
            "0xb47c4c8f73f009cc0c0d3f92b388d13e293f0b65": {"symbol": "USDC", "stable": True},
        },
        # Formato de enlace del explorador no confirmado; se puede sobrescribir.
        "explorer_tx": "https://elysium.kinetiq.xyz/explorer/tx/{}",
        "explorer_address": "https://elysium.kinetiq.xyz/explorer/address/{}",
        "dexscreener": "elysium",
        "geckoterminal": "elysium",
        "max_block_range": 1000,
        "backfill_blocks": 5000,
        "poll_seconds": 10,
    },
}

EVM_CHAINS = [k for k, v in CHAINS.items() if v["family"] == "evm"]

for _key, _cfg in CHAINS.items():
    _cfg["key"] = _key
    _override = os.environ.get(f"RPC_URL_{_key.upper()}")
    if _override:
        _cfg["rpc"] = _override
    _cfg["rpc_is_custom"] = bool(_override)
    _cfg["enabled"] = os.environ.get(f"FTT_DISABLE_{_key.upper()}", "") != "1"
