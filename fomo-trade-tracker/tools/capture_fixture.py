"""Guarda una transacción real (respuesta RPC sin modificar) como fixture para los tests.

Uso:
  python3 tools/capture_fixture.py solana <firma> <nombre>
  python3 tools/capture_fixture.py <red_evm> <tx_hash> <nombre>
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from tracker import evm, solana  # noqa: E402
from tracker.config import CHAINS  # noqa: E402

FIXTURES = Path(__file__).resolve().parent.parent / "tests" / "fixtures"


def main() -> None:
    if len(sys.argv) != 4:
        print(__doc__)
        sys.exit(1)
    chain, tx_id, name = sys.argv[1:]
    cfg = CHAINS[chain]
    if cfg["family"] == "solana":
        data = {"chain": chain, "tx": solana.get_transaction(cfg["rpc"], tx_id)}
    else:
        data = {"chain": chain, **evm.fetch_tx_bundle(cfg["rpc"], tx_id)}
    FIXTURES.mkdir(parents=True, exist_ok=True)
    out = FIXTURES / f"{name}.json"
    out.write_text(json.dumps(data, indent=1))
    print(f"Guardado {out}")


if __name__ == "__main__":
    main()
