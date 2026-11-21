"""Utilidades compartidas por los tests (sin red)."""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

FIXTURES = Path(__file__).resolve().parent / "fixtures"


def load_fixture(name: str) -> dict:
    return json.loads((FIXTURES / f"{name}.json").read_text())


class StubPrices:
    """Sustituto de PriceService con precios fijos (los tests no usan la red)."""

    def __init__(self, infos: dict[str, dict] | None = None, native: dict[str, float] | None = None):
        self.infos = {k.lower() if k.startswith("0x") else k: v for k, v in (infos or {}).items()}
        self.native = native or {}

    def _key(self, address: str) -> str:
        return address.lower() if address.startswith("0x") else address

    def token_info(self, chain: str, address: str):
        return self.infos.get(self._key(address))

    def token_infos(self, chain: str, addresses):
        return {self._key(a): self.infos.get(self._key(a)) for a in addresses}

    def native_usd(self, chain: str):
        return self.native.get(chain)


class StubTokenReader:
    def __init__(self, meta: dict[str, dict]):
        self._meta = {k.lower(): v for k, v in meta.items()}

    def meta(self, chain: str, rpc: str, token: str) -> dict:
        return self._meta.get(token.lower(), {"decimals": 18, "symbol": None, "name": None})
