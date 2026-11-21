/* FOMO Trade Tracker — interfaz (sin dependencias). Todo el contenido dinámico se
   inserta con textContent para evitar inyección de HTML. */
"use strict";

const state = {
  traders: [],
  chains: [],
  evmChains: [],
  trades: [],
  seen: new Set(),
  filter: { side: "", trader: "", chain: "" },
  sound: loadPref("sound", true),
  oldestId: null,
  hasMore: false,
};

const LOCALE = "es-ES";
const $ = (sel, root = document) => root.querySelector(sel);

// ---------- utilidades ----------
function loadPref(key, fallback) {
  try { const v = localStorage.getItem("ftt:" + key); return v === null ? fallback : JSON.parse(v); }
  catch { return fallback; }
}
function savePref(key, value) {
  try { localStorage.setItem("ftt:" + key, JSON.stringify(value)); } catch { /* sin almacenamiento */ }
}

function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === "class") el.className = v;
    else if (k === "text") el.textContent = v;
    else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
    else if (k === "dataset") Object.assign(el.dataset, v);
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const c of children.flat()) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

async function api(path, opts = {}) {
  const res = await fetch("/api" + path, {
    method: opts.method || "GET",
    headers: opts.body ? { "Content-Type": "application/json" } : undefined,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch { /* vacío */ }
  if (!res.ok) throw new Error((data && data.error) || `Error ${res.status}`);
  return data;
}

const fmtUsd = (v) => {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  if (v > 0 && v < 0.01) return "< 0,01 $";
  return new Intl.NumberFormat(LOCALE, { style: "currency", currency: "USD", maximumFractionDigits: v >= 1000 ? 0 : 2 }).format(v);
};
const fmtAmount = (v) => {
  if (v === null || v === undefined) return "—";
  const a = Math.abs(v);
  if (a >= 1e6) return new Intl.NumberFormat(LOCALE, { notation: "compact", maximumFractionDigits: 2 }).format(v);
  if (a >= 1) return new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 2 }).format(v);
  return new Intl.NumberFormat(LOCALE, { maximumSignificantDigits: 4 }).format(v);
};
const fmtPrice = (v) => {
  if (v === null || v === undefined) return "—";
  if (v >= 1) return new Intl.NumberFormat(LOCALE, { style: "currency", currency: "USD", maximumFractionDigits: 4 }).format(v);
  return new Intl.NumberFormat(LOCALE, { maximumSignificantDigits: 4 }).format(v) + " $";
};
const fmtNum = (v) => (v === null || v === undefined ? "—" : new Intl.NumberFormat(LOCALE).format(v));
const shortAddr = (a) => (a && a.length > 14 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a || "");
function timeAgo(ts, short = false) {
  if (!ts) return "—";
  const s = Math.max(0, Math.floor(Date.now() / 1000 - ts));
  const p = short ? "" : "hace ";
  if (s < 60) return `${p}${s} s`;
  if (s < 3600) return `${p}${Math.floor(s / 60)} min`;
  if (s < 86400) return `${p}${Math.floor(s / 3600)} h`;
  return new Date(ts * 1000).toLocaleDateString(LOCALE, { day: "2-digit", month: "short" });
}
const fmtDate = (ts) => (ts ? new Date(ts * 1000).toLocaleString(LOCALE, { dateStyle: "medium", timeStyle: "medium" }) : "—");
const tokenLabel = (t) => t.token_symbol || shortAddr(t.token_address);
const chainName = (key) => (state.chains.find((c) => c.key === key) || {}).name || key;

const VERIF = {
  unverified: { label: "No verificada", cls: "badge-unverified", icon: "⚠" },
  declared: { label: "Declarada", cls: "badge-declared", icon: "ⓘ" },
  confirmed: { label: "Confirmada", cls: "badge-confirmed", icon: "✓" },
};
const SIDE_LABEL = { BUY: "BUY", SELL: "SELL", IN: "ENTRADA", OUT: "SALIDA" };

function toast(title, body, kind = "info", onclick) {
  const el = h("div", { class: `toast toast-${kind}`, role: "status" },
    h("div", { class: "toast-title" }, title), body ? h("div", { class: "toast-body", text: body }) : null);
  if (onclick) el.addEventListener("click", () => { onclick(); el.remove(); });
  $("#toasts").prepend(el);
  setTimeout(() => el.remove(), kind === "info" ? 4000 : 12000);
  while ($("#toasts").children.length > 5) $("#toasts").lastChild.remove();
}

// Sonido corto con Web Audio (agudo = BUY, grave = SELL)
let audioCtx = null;
function beep(side) {
  if (!state.sound) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const notes = side === "BUY" ? [880, 1175] : [523, 392];
    notes.forEach((f, i) => {
      const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
      o.frequency.value = f; o.type = "sine";
      const t0 = audioCtx.currentTime + i * 0.13;
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.15, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.12);
      o.connect(g).connect(audioCtx.destination); o.start(t0); o.stop(t0 + 0.13);
    });
  } catch { /* audio no disponible */ }
}

// ---------- traders ----------
async function loadTraders() {
  const { traders } = await api("/traders");
  state.traders = traders;
  renderTraders();
  renderTraderFilter();
}

function renderTraders() {
  const box = $("#traders");
  box.replaceChildren();
  $("#traders-empty").hidden = state.traders.length > 0;
  for (const t of state.traders) {
    const toggle = h("label", { class: "switch", title: t.active ? "Seguimiento activo" : "Seguimiento pausado" },
      h("input", { type: "checkbox", checked: !!t.active, "aria-label": `Seguir a ${t.display_name}`,
        onchange: (e) => patchTrader(t.id, { active: e.target.checked }) }),
      h("span"));
    const wallets = h("ul", { class: "wallets" },
      t.wallets.map((w) => {
        const v = VERIF[w.verification];
        const chains = w.family === "solana" ? ["solana"] : w.chains.split(",");
        return h("li", { class: "wallet" + (w.active ? "" : " is-off") },
          h("label", { class: "switch switch-sm", title: "Vigilar esta wallet" },
            h("input", { type: "checkbox", checked: !!w.active, "aria-label": `Vigilar wallet ${w.address}`,
              onchange: (e) => patchWallet(w.id, { active: e.target.checked }) }), h("span")),
          h("span", { class: "addr", title: w.address }, shortAddr(w.address)),
          h("button", { class: "icon-btn", type: "button", title: "Copiar dirección", "aria-label": "Copiar dirección",
            onclick: () => copy(w.address) }, "⧉"),
          h("button", { class: `badge ${v.cls}`, type: "button", title: "Ver / cambiar verificación",
            onclick: () => openVerify(t, w) }, `${v.icon} ${v.label}`),
          h("span", { class: "chain-badge", title: chains.map(chainName).join(", ") },
            w.family === "solana" ? "Solana" : `EVM · ${chains.length} redes`),
          h("span", { class: "wallet-actions" },
            h("button", { class: "icon-btn", type: "button", title: "Eliminar wallet", "aria-label": "Eliminar wallet",
              onclick: () => deleteWallet(w) }, "🗑")));
      }));
    box.append(h("article", { class: "trader" + (t.active ? "" : " is-off") },
      h("div", { class: "trader-top" },
        h("div", { class: "trader-id" },
          h("div", { class: "trader-name", text: t.display_name }),
          t.fomo_handle ? h("div", { class: "trader-handle", text: "@" + t.fomo_handle }) : null),
        toggle),
      h("div", { class: "trader-stats" },
        h("span", { class: "b" }, `${t.buys} BUY`), h("span", { class: "s" }, `${t.sells} SELL`),
        h("span", {}, t.last_trade_at ? `última ${timeAgo(t.last_trade_at)}` : "sin operaciones")),
      t.wallets.length ? wallets : h("p", { class: "muted small", text: "Sin wallets. Añade su dirección pública." }),
      h("div", { class: "trader-actions" },
        h("button", { class: "btn btn-sm", type: "button", onclick: () => openWallet(t) }, "+ Wallet"),
        h("button", { class: "btn btn-sm btn-ghost", type: "button", onclick: () => openTrader(t) }, "Editar"),
        h("button", { class: "btn btn-sm btn-ghost", type: "button",
          onclick: () => { state.filter.trader = String(t.id); $("#f-trader").value = String(t.id); reloadTrades(); } }, "Ver operaciones"),
        h("button", { class: "btn btn-sm btn-ghost btn-danger", type: "button", onclick: () => deleteTrader(t) }, "Eliminar"))));
  }
}

function renderTraderFilter() {
  const sel = $("#f-trader");
  const cur = sel.value;
  sel.replaceChildren(h("option", { value: "" }, "Todos los traders"),
    ...state.traders.map((t) => h("option", { value: String(t.id) }, t.display_name)));
  sel.value = state.traders.some((t) => String(t.id) === cur) ? cur : "";
}

async function patchTrader(id, body) {
  try { await api(`/traders/${id}`, { method: "PATCH", body }); await loadTraders(); loadStatus(); }
  catch (e) { toast("No se pudo actualizar", e.message, "info"); }
}
async function patchWallet(id, body) {
  try { await api(`/wallets/${id}`, { method: "PATCH", body }); await loadTraders(); loadStatus(); }
  catch (e) { toast("No se pudo actualizar", e.message, "info"); }
}
async function deleteTrader(t) {
  if (!confirm(`¿Eliminar a «${t.display_name}», sus wallets y su historial de operaciones?`)) return;
  await api(`/traders/${t.id}`, { method: "DELETE" });
  await loadTraders(); reloadTrades(); loadStatus();
}
async function deleteWallet(w) {
  if (!confirm(`¿Eliminar la wallet ${shortAddr(w.address)} y sus operaciones registradas?`)) return;
  await api(`/wallets/${w.id}`, { method: "DELETE" });
  await loadTraders(); reloadTrades(); loadStatus();
}
async function copy(text) {
  try { await navigator.clipboard.writeText(text); toast("Copiado", shortAddr(text)); }
  catch { prompt("Copia la dirección:", text); }
}

// ---------- modales ----------
function setupDialog(dlg) {
  dlg.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", () => dlg.close()));
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
}
function formError(form, msg) {
  const p = form.querySelector(".form-error");
  p.textContent = msg || ""; p.hidden = !msg;
}

let editingTrader = null;
function openTrader(t = null) {
  editingTrader = t;
  const form = $("#form-trader");
  form.reset(); formError(form, "");
  $("#dlg-trader-title").textContent = t ? "Editar trader" : "Agregar trader";
  if (t) {
    form.display_name.value = t.display_name;
    form.fomo_handle.value = t.fomo_handle ? "@" + t.fomo_handle : "";
    form.notes.value = t.notes || "";
  }
  $("#dlg-trader").showModal();
}
$("#form-trader").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.target;
  const body = { display_name: f.display_name.value, fomo_handle: f.fomo_handle.value, notes: f.notes.value };
  try {
    if (editingTrader) await api(`/traders/${editingTrader.id}`, { method: "PATCH", body });
    else {
      const { trader } = await api("/traders", { method: "POST", body });
      $("#dlg-trader").close(); await loadTraders(); openWallet(trader); return;
    }
    $("#dlg-trader").close(); await loadTraders();
  } catch (err) { formError(f, err.message); }
});

let walletTrader = null;
function openWallet(t) {
  walletTrader = t;
  const form = $("#form-wallet");
  form.reset(); formError(form, "");
  $("#dlg-wallet-trader").textContent = t.display_name;
  $(".evm-chains", form).hidden = true;
  const checks = $("#evm-chain-checks");
  checks.replaceChildren(...state.evmChains.map((k) => h("label", {},
    h("input", { type: "checkbox", name: "chains", value: k, checked: true }), chainName(k))));
  $("#dlg-wallet").showModal();
}
$("#form-wallet").address.addEventListener("input", (e) => {
  $(".evm-chains", $("#form-wallet")).hidden = !/^0x[0-9a-fA-F]{40}$/.test(e.target.value.trim());
});
$("#form-wallet").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.target;
  const address = f.address.value.trim();
  const body = { address, verification: f.verification.value, evidence_url: f.evidence_url.value, evidence_note: f.evidence_note.value };
  if (/^0x/i.test(address)) body.chains = [...f.querySelectorAll("input[name=chains]:checked")].map((c) => c.value);
  try {
    await api(`/traders/${walletTrader.id}/wallets`, { method: "POST", body });
    $("#dlg-wallet").close();
    toast("Wallet añadida", "Se cargará su actividad reciente como historial (sin alertas).");
    await loadTraders(); loadStatus();
    setTimeout(reloadTrades, 8000);
  } catch (err) { formError(f, err.message); }
});

let verifyWallet = null;
async function openVerify(t, w) {
  verifyWallet = w;
  const form = $("#form-verify");
  form.reset(); formError(form, "");
  $("#verify-address").textContent = `${t.display_name} · ${w.address}`;
  form.verification.value = w.verification;
  form.evidence_url.value = w.evidence_url || "";
  form.evidence_note.value = w.evidence_note || "";
  const list = $("#verify-list");
  list.replaceChildren(h("p", { class: "empty", text: "Cargando operaciones detectadas…" }));
  $("#dlg-verify").showModal();
  try {
    const { trades } = await api(`/trades?wallet_id=${w.id}&limit=15`);
    list.replaceChildren(trades.length
      ? h("table", {}, h("tbody", {}, trades.map((tr) => h("tr", {},
          h("td", {}, h("span", { class: `pill pill-${tr.side}` }, SIDE_LABEL[tr.side])),
          h("td", { text: tokenLabel(tr) }), h("td", { class: "num", text: fmtAmount(tr.token_amount) }),
          h("td", { class: "num", text: fmtUsd(tr.value_usd) }), h("td", { text: tr.chain_name }),
          h("td", { text: fmtDate(tr.block_time) })))))
      : h("p", { class: "empty", text: "Aún no hay operaciones detectadas para esta wallet." }));
  } catch (e) { list.replaceChildren(h("p", { class: "empty", text: e.message })); }
}
$("#form-verify").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.target;
  try {
    await api(`/wallets/${verifyWallet.id}`, { method: "PATCH", body: {
      verification: f.verification.value, evidence_url: f.evidence_url.value, evidence_note: f.evidence_note.value } });
    $("#dlg-verify").close(); await loadTraders(); loadStatus(); reloadTrades();
  } catch (err) { formError(f, err.message); }
});

// ---------- operaciones ----------
function tradeQuery(before) {
  const p = new URLSearchParams({ limit: "50" });
  if (state.filter.side) p.set("side", state.filter.side);
  if (state.filter.trader) p.set("trader_id", state.filter.trader);
  if (state.filter.chain) p.set("chain", state.filter.chain);
  if (before) { p.set("before_id", String(before.id)); p.set("before_time", String(before.block_time)); }
  return "/trades?" + p.toString();
}

async function reloadTrades() {
  const { trades } = await api(tradeQuery());
  state.trades = trades;
  trades.forEach((t) => state.seen.add(t.id));
  state.hasMore = trades.length === 50;
  renderTrades();
}
async function loadMore() {
  const last = state.trades[state.trades.length - 1];
  if (!last) return;
  const { trades } = await api(tradeQuery(last));
  state.trades.push(...trades);
  state.hasMore = trades.length === 50;
  renderTrades();
}

function matchesFilter(t) {
  const f = state.filter;
  if (f.side === "XFER") { if (!["IN", "OUT"].includes(t.side)) return false; }
  else if (f.side) { if (t.side !== f.side) return false; }
  else if (!["BUY", "SELL"].includes(t.side)) return false;
  if (f.trader && String(t.trader_id) !== f.trader) return false;
  if (f.chain && t.chain !== f.chain) return false;
  return true;
}

function tradeRow(t, isNew = false) {
  const unverified = t.wallet_verification === "unverified";
  const priceTitle = t.price_quote && t.quote_symbol ? `${fmtAmount(t.price_quote)} ${t.quote_symbol} por token` : "";
  const row = h("tr", { class: `row-${t.side.toLowerCase()}${isNew ? " is-new" : ""}`, tabindex: "0",
      onclick: () => openTrade(t), onkeydown: (e) => { if (e.key === "Enter") openTrade(t); } },
    h("td", {}, h("span", { class: `pill pill-${t.side}` }, SIDE_LABEL[t.side])),
    h("td", {}, h("div", { class: "trader-cell", title: t.trader_name }, h("span", { text: t.trader_name }),
      unverified ? h("span", { class: "warn-mini", text: "⚠ wallet no verificada" }) : null)),
    h("td", {}, h("div", { class: "tok" }, h("span", { class: "sym", text: tokenLabel(t) }),
      t.token_name ? h("span", { class: "name", text: t.token_name }) : null)),
    h("td", { class: "num" }, fmtAmount(t.token_amount),
      t.side === "SELL" && t.pct_position_sold !== null ? h("div", { class: "muted small", text: `${fmtNum(t.pct_position_sold)} % de la posición` }) : null),
    h("td", { class: "num", title: priceTitle }, fmtPrice(t.price_usd)),
    h("td", { class: "num" }, fmtUsd(t.value_usd), t.usd_source === "market" ? h("div", { class: "muted small", text: "estimado" }) : null),
    h("td", {}, h("span", { class: "chain-badge", text: t.chain_name })),
    h("td", { class: "num", title: fmtDate(t.block_time), "data-ts": String(t.block_time) }, timeAgo(t.block_time, true)));
  return row;
}

function renderTrades() {
  const body = $("#trades");
  body.replaceChildren(...state.trades.map((t) => tradeRow(t)));
  $("#trades-empty").hidden = state.trades.length > 0;
  $("#btn-more").hidden = !state.hasMore;
}

function openTrade(t) {
  const v = VERIF[t.wallet_verification] || VERIF.unverified;
  $("#d-side").className = `pill pill-${t.side}`;
  $("#d-side").textContent = SIDE_LABEL[t.side];
  $("#d-title").textContent = `${t.trader_name} · ${tokenLabel(t)} · ${t.chain_name}`;
  const warn = $("#d-warning");
  if (t.wallet_verification === "unverified") {
    warn.hidden = false;
    warn.textContent = "Wallet NO verificada: esta operación es de la dirección indicada, pero no está comprobado que pertenezca a este trader.";
  } else warn.hidden = true;

  const link = (href, text) => (href ? h("a", { href, target: "_blank", rel: "noopener noreferrer" }, text) : document.createTextNode(text));
  const rows = [
    ["Trader", `${t.trader_name}${t.fomo_handle ? " (@" + t.fomo_handle + ")" : ""}`],
    ["Wallet", h("span", {}, link(t.wallet_url, t.wallet_address), " ", h("span", { class: `badge ${v.cls}` }, `${v.icon} ${v.label}`))],
    t.wallet_evidence_url ? ["Evidencia", link(t.wallet_evidence_url, t.wallet_evidence_url)] : null,
    ["Operación", SIDE_LABEL[t.side]],
    ["Token", `${t.token_symbol || "?"}${t.token_name ? " — " + t.token_name : ""}`],
    ["Contrato", h("span", { class: "mono" }, link(t.token_url, t.token_address),
      h("button", { class: "icon-btn copy", type: "button", title: "Copiar contrato", onclick: () => copy(t.token_address) }, "⧉"))],
    ["Red", t.chain_name],
    ["Cantidad", `${fmtAmount(t.token_amount)} ${t.token_symbol || ""}`],
    t.quote_amount ? [t.side === "BUY" ? "Pagado" : "Recibido", `${fmtAmount(t.quote_amount)} ${t.quote_symbol || ""}`] : null,
    t.price_quote ? ["Precio (en moneda de pago)", `${fmtAmount(t.price_quote)} ${t.quote_symbol || ""} / token`] : null,
    ["Precio USD", fmtPrice(t.price_usd)],
    ["Valor aprox. USD", `${fmtUsd(t.value_usd)}${t.usd_source === "quote" ? " · derivado del pago real" : t.usd_source === "market" ? " · estimado a precio de mercado" : ""}`],
    t.side === "SELL" || t.side === "OUT" ? ["% de la posición vendida", t.pct_position_sold !== null ? `${fmtNum(t.pct_position_sold)} %` : "No calculable"] : null,
    t.position_after !== null ? ["Saldo tras la operación", fmtAmount(t.position_after)] : null,
    t.liquidity_usd ? ["Liquidez del par (al detectar)", fmtUsd(t.liquidity_usd)] : null,
    t.market_cap ? ["Capitalización (al detectar)", fmtUsd(t.market_cap)] : null,
    ["Fecha y hora (bloque)", fmtDate(t.block_time)],
    ["Detectada", `${fmtDate(t.detected_at)}${t.is_backfill ? " · cargada como historial" : t.detection_delay_s !== undefined ? ` · ${t.detection_delay_s} s después del bloque` : ""}`],
    ["Transacción", link(t.tx_url, t.tx_hash)],
    t.pair_url ? ["Gráfico", link(t.pair_url, "Ver en DexScreener")] : null,
  ].filter(Boolean);
  $("#d-grid").replaceChildren(...rows.flatMap(([k, val]) => [h("dt", { text: k }), h("dd", {}, val)]));
  $("#d-notes").textContent = t.notes || "";
  $("#dlg-trade").showModal();
}

function onLiveTrade(t, notify) {
  if (state.seen.has(t.id)) return; // sin duplicados
  state.seen.add(t.id);
  if (matchesFilter(t)) {
    // Insertar en su posición cronológica (el historial inicial puede llegar desordenado).
    const newer = (a, b) => a.block_time > b.block_time || (a.block_time === b.block_time && a.id > b.id);
    let idx = state.trades.findIndex((x) => newer(t, x));
    if (idx === -1 && state.hasMore) return; // más antigua que lo cargado: aparecerá al paginar
    if (idx === -1) idx = state.trades.length;
    state.trades.splice(idx, 0, t);
    const body = $("#trades");
    body.insertBefore(tradeRow(t, true), body.children[idx] || null);
    $("#trades-empty").hidden = true;
  }
  if (notify && (t.side === "BUY" || t.side === "SELL")) {
    const unverified = t.wallet_verification === "unverified" ? " (wallet no verificada)" : "";
    const title = `${t.side} · ${t.trader_name}${unverified}`;
    const body = `${t.side === "BUY" ? "Compró" : "Vendió"} ${fmtAmount(t.token_amount)} ${tokenLabel(t)} · ${fmtUsd(t.value_usd)} · ${t.chain_name}`
      + (t.side === "SELL" && t.pct_position_sold !== null ? ` · ${fmtNum(t.pct_position_sold)} % de la posición` : "");
    toast(h("span", {}, h("span", { class: `pill pill-${t.side}` }, t.side), " ", t.trader_name + unverified), body, t.side, () => openTrade(t));
    beep(t.side);
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        const n = new Notification(title, { body, tag: `trade-${t.id}` });
        n.onclick = () => { window.focus(); openTrade(t); n.close(); };
      } catch { /* algunos navegadores solo permiten notificaciones desde un service worker */ }
    }
  }
  scheduleRefresh();
}

let refreshTimer = null;
function scheduleRefresh() {
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(() => { loadStatus(); loadTraders(); }, 1500);
}

// ---------- estado de redes y KPIs ----------
function renderStatus(chains) {
  const ul = $("#chains");
  ul.replaceChildren(...chains.map((c) => {
    const labels = { ok: "Vigilando", idle: "En reposo", error: "Error", starting: "Iniciando", disabled: "Desactivada" };
    const meta = c.state === "ok" ? `${c.wallets} wallet${c.wallets === 1 ? "" : "s"} · ${c.latency_ms ?? "—"} ms`
      : labels[c.state] || c.state;
    return h("li", { class: `chain st-${c.state}`, title: c.last_poll_at ? `Última consulta: ${fmtDate(c.last_poll_at)}` : "" },
      h("span", { class: "dot", "aria-hidden": "true" }),
      h("span", { text: c.name + (c.rpc_custom ? " · RPC propio" : "") }),
      h("span", { class: "chain-meta", text: meta }),
      c.state === "error" ? h("span", { class: "chain-err", text: c.hint || c.last_error || "" }) : null);
  }));
}

async function loadStatus() {
  try {
    const { chains, stats } = await api("/status");
    state.statusMap = Object.fromEntries(chains.map((c) => [c.chain, c]));
    renderStatus(chains);
    $("#k-traders").textContent = fmtNum(stats.active_traders);
    $("#k-wallets").textContent = fmtNum(stats.active_wallets);
    $("#k-buys").textContent = fmtNum(stats.buys_24h);
    $("#k-sells").textContent = fmtNum(stats.sells_24h);
    $("#k-buys-usd").textContent = stats.buy_usd_24h ? fmtUsd(stats.buy_usd_24h) : "";
    $("#k-sells-usd").textContent = stats.sell_usd_24h ? fmtUsd(stats.sell_usd_24h) : "";
    $("#k-unverified").textContent = fmtNum(stats.unverified_wallets);
  } catch { /* se reintenta en la siguiente actualización */ }
}

// ---------- tiempo real (SSE) ----------
function connect() {
  const es = new EventSource("/api/events");
  const conn = $("#conn");
  es.onopen = () => { conn.textContent = "En vivo"; conn.className = "conn conn-on"; };
  es.onerror = () => { conn.textContent = "Reconectando…"; conn.className = "conn conn-off"; };
  es.addEventListener("trade", (e) => {
    try { const ev = JSON.parse(e.data); onLiveTrade(ev.trade, ev.notify); } catch { /* evento corrupto */ }
  });
  es.addEventListener("status", (e) => {
    try {
      const { status } = JSON.parse(e.data);
      state.statusMap = { ...(state.statusMap || {}), [status.chain]: status };
      renderStatus(state.chains.map((c) => state.statusMap[c.key]).filter(Boolean));
    } catch { /* ignorar */ }
  });
}

// ---------- arranque ----------
function updateNotifyButton() {
  const b = $("#btn-notify");
  if (!("Notification" in window)) { b.hidden = true; return; }
  const p = Notification.permission;
  b.textContent = p === "granted" ? "🔔 Notificaciones activas" : p === "denied" ? "🔕 Notificaciones bloqueadas" : "🔔 Activar notificaciones";
  b.disabled = p !== "default";
}

async function init() {
  [$("#dlg-trader"), $("#dlg-wallet"), $("#dlg-verify"), $("#dlg-trade")].forEach(setupDialog);
  const cfg = await api("/config");
  state.chains = cfg.chains;
  state.evmChains = cfg.evm_chains;
  $("#f-chain").append(...cfg.chains.map((c) => h("option", { value: c.key }, c.name)));

  $("#btn-add-trader").addEventListener("click", () => openTrader());
  $("#btn-more").addEventListener("click", loadMore);
  document.querySelectorAll(".seg-btn").forEach((b) => b.addEventListener("click", () => {
    document.querySelectorAll(".seg-btn").forEach((x) => x.classList.toggle("is-active", x === b));
    state.filter.side = b.dataset.side; reloadTrades();
  }));
  $("#f-trader").addEventListener("change", (e) => { state.filter.trader = e.target.value; reloadTrades(); });
  $("#f-chain").addEventListener("change", (e) => { state.filter.chain = e.target.value; reloadTrades(); });

  const sb = $("#btn-sound");
  sb.setAttribute("aria-pressed", String(state.sound));
  sb.addEventListener("click", () => {
    state.sound = !state.sound; savePref("sound", state.sound);
    sb.setAttribute("aria-pressed", String(state.sound));
    sb.textContent = state.sound ? "🔊 Sonido" : "🔇 Silencio";
    if (state.sound) beep("BUY");
  });
  sb.textContent = state.sound ? "🔊 Sonido" : "🔇 Silencio";
  updateNotifyButton();
  $("#btn-notify").addEventListener("click", async () => {
    try { await Notification.requestPermission(); } catch { /* ignorar */ }
    updateNotifyButton();
  });

  await Promise.all([loadTraders(), reloadTrades(), loadStatus()]);
  connect();
  // refresco de "hace X s" y KPIs
  setInterval(() => {
    document.querySelectorAll("td[data-ts]").forEach((td) => { td.textContent = timeAgo(Number(td.dataset.ts), true); });
  }, 15000);
  setInterval(loadStatus, 30000);
}

init().catch((e) => toast("Error al iniciar", e.message));
