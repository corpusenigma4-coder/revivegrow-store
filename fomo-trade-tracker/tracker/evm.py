"""Lectura de operaciones en redes EVM (Base, BNB, Ethereum, Monad, Robinhood, Arc, Elysium).

Método:
  1. eth_getLogs con el evento ERC-20 Transfer filtrado por la wallet como
     emisora (topic1) o receptora (topic2). Funciona también con "smart wallets"
     y transacciones enviadas por un relayer, porque mira los tokens que entran y
     salen de la dirección, no quién firmó.
  2. Para cada transacción encontrada se lee el recibo y se calculan los cambios
     de saldo de la wallet. La moneda nativa (ETH, BNB, MON...) se mide por
     diferencia de saldo entre el bloque anterior y el de la transacción.
"""
from __future__ import annotations

import threading

from .net import RpcError, rpc_batch, rpc_call

TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"


def pad_topic(address: str) -> str:
    return "0x" + "0" * 24 + address.lower()[2:]


def topic_to_address(topic: str) -> str:
    return "0x" + topic[-40:].lower()


def is_evm_address(s: str) -> bool:
    if not isinstance(s, str) or len(s) != 42 or not s.startswith("0x"):
        return False
    try:
        int(s[2:], 16)
        return True
    except ValueError:
        return False


def block_number(rpc: str) -> int:
    return int(rpc_call(rpc, "eth_blockNumber", []), 16)


def get_transfer_logs(rpc: str, from_block: int, to_block: int, wallets: list[str], direction: str) -> list[dict]:
    topics: list = [TRANSFER_TOPIC]
    padded = [pad_topic(w) for w in wallets]
    if direction == "from":
        topics.append(padded)
    else:
        topics.extend([None, padded])
    return rpc_call(rpc, "eth_getLogs", [{"fromBlock": hex(from_block), "toBlock": hex(to_block), "topics": topics}]) or []


def fetch_tx_bundle(rpc: str, tx_hash: str) -> dict:
    tx, receipt = rpc_batch(rpc, [("eth_getTransactionByHash", [tx_hash]), ("eth_getTransactionReceipt", [tx_hash])])
    block = rpc_call(rpc, "eth_getBlockByNumber", [receipt["blockNumber"], False]) if receipt else None
    return {
        "tx": tx,
        "receipt": receipt,
        "block": {"number": block["number"], "timestamp": block["timestamp"]} if block else None,
    }


# ---- Llamadas a contratos ERC-20 -------------------------------------------

def _decode_abi_string(data: str | None) -> str | None:
    if not data or data == "0x":
        return None
    raw = bytes.fromhex(data[2:])
    try:
        if len(raw) >= 64:
            offset = int.from_bytes(raw[:32], "big")
            if offset + 32 <= len(raw):
                length = int.from_bytes(raw[offset:offset + 32], "big")
                s = raw[offset + 32: offset + 32 + length].decode("utf-8", "ignore")
                return s.strip("\x00").strip() or None
        return raw[:32].rstrip(b"\x00").decode("utf-8", "ignore").strip() or None  # bytes32
    except Exception:
        return None


class TokenReader:
    """Lee decimals/symbol/name on-chain con caché."""

    def __init__(self):
        self._cache: dict[tuple[str, str], dict] = {}
        self._lock = threading.Lock()

    def meta(self, chain: str, rpc: str, token: str) -> dict:
        key = (chain, token.lower())
        with self._lock:
            if key in self._cache:
                return self._cache[key]
        out = {"decimals": None, "symbol": None, "name": None}
        try:
            dec, sym, name = rpc_batch(rpc, [
                ("eth_call", [{"to": token, "data": "0x313ce567"}, "latest"]),
                ("eth_call", [{"to": token, "data": "0x95d89b41"}, "latest"]),
                ("eth_call", [{"to": token, "data": "0x06fdde03"}, "latest"]),
            ])
            out["decimals"] = int(dec, 16) if dec and dec != "0x" else None
            out["symbol"] = _decode_abi_string(sym)
            out["name"] = _decode_abi_string(name)
        except (RpcError, ValueError, TypeError):
            pass
        if out["decimals"] is not None:
            with self._lock:
                self._cache[key] = out
        return out


def balance_of(rpc: str, token: str, wallet: str, block_hex: str) -> int | None:
    try:
        res = rpc_call(rpc, "eth_call", [{"to": token, "data": "0x70a08231" + pad_topic(wallet)[2:]}, block_hex], retries=1)
        return int(res, 16) if res and res != "0x" else None
    except (RpcError, ValueError):
        return None


def native_delta(rpc: str, bundle: dict, wallet: str) -> tuple[int | None, str]:
    """Variación del saldo nativo de la wallet causada por la transacción (sin gas).

    Devuelve (wei, método). Usa la diferencia de saldo entre bloques; si el nodo
    no conserva ese estado, recurre al `value` enviado por la propia wallet.
    """
    tx, receipt = bundle["tx"], bundle["receipt"]
    bn = int(receipt["blockNumber"], 16)
    sender = (tx.get("from") or "").lower()
    gas_paid = 0
    if sender == wallet:
        price = int(receipt.get("effectiveGasPrice") or tx.get("gasPrice") or "0x0", 16)
        gas_paid = int(receipt.get("gasUsed") or "0x0", 16) * price + int(receipt.get("l1Fee") or "0x0", 16)
    try:
        before, after = rpc_batch(rpc, [
            ("eth_getBalance", [wallet, hex(bn - 1)]),
            ("eth_getBalance", [wallet, hex(bn)]),
        ])
        return int(after, 16) - int(before, 16) + gas_paid, "balance_diff"
    except (RpcError, TypeError, ValueError):
        if sender == wallet:
            return -int(tx.get("value") or "0x0", 16), "tx_value"
        return None, "unknown"


def wallet_token_deltas(bundle: dict, wallet: str) -> dict[str, int]:
    """Variación bruta (en unidades mínimas) de cada token ERC-20 para la wallet."""
    deltas: dict[str, int] = {}
    for log in (bundle.get("receipt") or {}).get("logs") or []:
        topics = log.get("topics") or []
        if len(topics) != 3 or topics[0] != TRANSFER_TOPIC:
            continue  # ERC-721 usa 4 topics; se ignora
        data = log.get("data") or "0x"
        if len(data) != 66:
            continue
        frm, to = topic_to_address(topics[1]), topic_to_address(topics[2])
        if wallet not in (frm, to) or frm == to:
            continue
        amount = int(data, 16)
        token = log["address"].lower()
        if to == wallet:
            deltas[token] = deltas.get(token, 0) + amount
        if frm == wallet:
            deltas[token] = deltas.get(token, 0) - amount
    return {k: v for k, v in deltas.items() if v != 0}


def wallet_legs(chain_cfg: dict, bundle: dict, wallet: str, tokens: TokenReader,
                with_balances: bool = True) -> tuple[list[dict], dict]:
    """Patas de la operación para la wallet + información de diagnóstico."""
    wallet = wallet.lower()
    receipt = bundle.get("receipt") or {}
    if not receipt or receipt.get("status") not in ("0x1", 1, None):
        return [], {"skipped": "tx fallida"}
    rpc = chain_cfg["rpc"]
    block_hex = receipt["blockNumber"]
    legs: list[dict] = []
    ignore = {t.lower() for t in chain_cfg.get("ignore_tokens", [])}
    for token, raw in wallet_token_deltas(bundle, wallet).items():
        if token in ignore:
            continue
        meta = tokens.meta(chain_cfg["key"], rpc, token)
        dec = meta["decimals"] if meta["decimals"] is not None else 18
        post = balance_of(rpc, token, wallet, block_hex) if with_balances else None
        legs.append({
            "token": token,
            "delta": raw / 10 ** dec,
            "decimals": dec,
            "post_balance": (post / 10 ** dec) if post is not None else None,
            "onchain_symbol": meta["symbol"],
            "onchain_name": meta["name"],
        })
    diag: dict = {}
    if chain_cfg.get("native_mode", "balance_diff") == "none":
        wei, method = None, "ignored"
    elif with_balances:
        wei, method = native_delta(rpc, bundle, wallet)
    else:
        tx = bundle.get("tx") or {}
        wei, method = (-int(tx.get("value") or "0x0", 16), "tx_value") if (tx.get("from") or "").lower() == wallet else (None, "unknown")
    diag["native_method"] = method
    if wei:
        legs.append({"token": "native", "delta": wei / 10 ** chain_cfg["native_decimals"],
                     "decimals": chain_cfg["native_decimals"], "post_balance": None})
    return legs, diag
