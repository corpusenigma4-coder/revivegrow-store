"""Lectura de operaciones en Solana a partir de transacciones públicas.

Método: para cada transacción firmada que involucra la wallet, se comparan los
saldos antes/después (meta.preTokenBalances / postTokenBalances y
preBalances / postBalances) de las cuentas cuyo propietario es la wallet.
Esto funciona con cualquier DEX o agregador (Jupiter, Raydium, Pump, Meteora...)
porque no depende de decodificar instrucciones concretas.
"""
from __future__ import annotations

import re

from .config import SOLANA_WSOL
from .net import RpcError, rpc_call

LAMPORTS = 1_000_000_000


def get_new_signatures(rpc: str, address: str, until: str | None, limit: int) -> list[dict]:
    opts: dict = {"limit": limit, "commitment": "confirmed"}
    if until:
        opts["until"] = until
    return rpc_call(rpc, "getSignaturesForAddress", [address, opts]) or []


# Versión máxima de transacción aceptada. Solana introdujo la versión 1 en 2026; si
# aparece una versión superior, el nodo lo indica en el error y se reintenta con ella.
_max_tx_version = 1
_VERSION_RE = re.compile(r'maxSupportedTransactionVersion"?\s*:\s*(\d+)')


def get_transaction(rpc: str, signature: str) -> dict | None:
    global _max_tx_version
    for _ in range(2):
        try:
            return rpc_call(rpc, "getTransaction", [signature, {
                "encoding": "jsonParsed", "maxSupportedTransactionVersion": _max_tx_version,
                "commitment": "confirmed",
            }])
        except RpcError as e:
            m = _VERSION_RE.search(str(e))
            if m and int(m.group(1)) > _max_tx_version:
                _max_tx_version = int(m.group(1))
                continue
            raise
    return None


def _account_keys(tx: dict) -> list[str]:
    keys = ((tx.get("transaction") or {}).get("message") or {}).get("accountKeys") or []
    return [k["pubkey"] if isinstance(k, dict) else k for k in keys]


def wallet_legs(tx: dict, wallet: str) -> list[dict]:
    """Cambios de saldo de `wallet` en la transacción `tx` (formato jsonParsed)."""
    meta = tx.get("meta") or {}
    if meta.get("err") is not None:
        return []
    keys = _account_keys(tx)
    pre_bal = meta.get("preBalances") or []
    post_bal = meta.get("postBalances") or []

    # --- Tokens SPL / Token-2022 cuyo propietario es la wallet ---
    per_mint: dict[str, dict] = {}
    owned_token_accounts: set[int] = set()
    for which in ("preTokenBalances", "postTokenBalances"):
        for b in meta.get(which) or []:
            if b.get("owner") != wallet:
                continue
            idx = b.get("accountIndex")
            owned_token_accounts.add(idx)
            mint = b["mint"]
            ui = b.get("uiTokenAmount") or {}
            dec = int(ui.get("decimals") or 0)
            raw = int(ui.get("amount") or 0)
            m = per_mint.setdefault(mint, {"decimals": dec, "pre": 0, "post": 0})
            m["pre" if which == "preTokenBalances" else "post"] += raw

    legs: list[dict] = []
    for mint, m in per_mint.items():
        if mint == SOLANA_WSOL:
            continue  # el wSOL se contabiliza junto al SOL nativo (vía lamports)
        delta_raw = m["post"] - m["pre"]
        if delta_raw == 0:
            continue
        scale = 10 ** m["decimals"]
        legs.append({
            "token": mint,
            "delta": delta_raw / scale,
            "decimals": m["decimals"],
            "post_balance": m["post"] / scale,
        })

    # --- SOL: lamports de la wallet + lamports de sus cuentas de token (incluye wSOL y rent) ---
    sol_delta = 0
    if wallet in keys:
        i = keys.index(wallet)
        if i < len(pre_bal) and i < len(post_bal):
            sol_delta += post_bal[i] - pre_bal[i]
            if i == 0:  # la wallet pagó la comisión de red: no es parte del precio
                sol_delta += int(meta.get("fee") or 0)
    for idx in owned_token_accounts:
        if idx is not None and idx < len(pre_bal) and idx < len(post_bal):
            sol_delta += post_bal[idx] - pre_bal[idx]
    if sol_delta:
        legs.append({"token": "native", "delta": sol_delta / LAMPORTS, "decimals": 9, "post_balance": None})
    return legs


def signer_wallets(tx: dict) -> list[str]:
    keys = ((tx.get("transaction") or {}).get("message") or {}).get("accountKeys") or []
    return [k["pubkey"] for k in keys if isinstance(k, dict) and k.get("signer")]
