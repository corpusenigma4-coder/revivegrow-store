/**
 * Comportamiento del selector de paquetes, la barra fija y el formulario de pedido.
 *
 * Modalidad B (preferida): si /api/pedido responde { activo: true }, el pedido se registra en el
 *   servidor y la tienda recibe el aviso por la API oficial de WhatsApp.
 * Modalidad A (respaldo): sin servidor, se abre WhatsApp con el pedido escrito y se le pide al
 *   cliente que pulse «Enviar». Nunca se muestra «pedido registrado» en esta modalidad.
 */
import { TIENDA, enlaceWhatsApp } from "../config/tienda";
import { PRODUCTO_PREDETERMINADO, productoPorId } from "../config/catalogo";
import {
  celularVisible, costoEnvio, disponibilidad, fechaCortaEcuador, formatoUSD, mensajePedido, numeroPedido,
  paqueteDisponible, paquetePorId, textoEnvio, textoTotal, totalPedido, validarPedido,
  type Campo, type DatosPedido, type Paquete,
} from "../lib/pedido";
import { ruta } from "../lib/ruta";

type Modo = "servidor" | "whatsapp";
type Fbq = (...a: unknown[]) => void;

const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);
const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => [...root.querySelectorAll<T>(sel)];
const aleatorio = (n: number) => crypto.getRandomValues(new Uint8Array(n));
const nuevaClave = () =>
  typeof crypto.randomUUID === "function" ? crypto.randomUUID() : [...aleatorio(16)].map((b) => b.toString(16).padStart(2, "0")).join("");

function rastrear(evento: string, datos?: Record<string, unknown>) {
  const fbq = (window as unknown as { fbq?: Fbq }).fbq;
  if (fbq) fbq("track", evento, datos);
}

/** Producto de esta landing: <body data-producto="flo">; por defecto, TESTO-GH. */
const PROD = productoPorId(document.body.dataset.producto) ?? PRODUCTO_PREDETERMINADO;
const PAQUETES = PROD.paquetes;
const API = TIENDA.apiPedidos ?? ruta("/api/pedido");
const disp = disponibilidad(PROD.inventario);

const estado = {
  paquete: PROD.paqueteInicial,
  modo: null as Modo | null,
  turnstileSiteKey: null as string | null,
  turnstileToken: "",
  abiertoEn: 0,
  clave: nuevaClave(),
  numero: "",
  fecha: new Date(),
  datos: null as DatosPedido | null,
  enviando: false,
};

/* ================================================================ paquetes */

function paqueteActual(): Paquete {
  return paquetePorId(estado.paquete, PROD) ?? PAQUETES[0];
}

function fijarPaquete(id: string) {
  estado.paquete = id;
  $$<HTMLInputElement>("input[data-paquete]").forEach((i) => (i.checked = i.value === id));
  const p = paqueteActual();
  $$("[data-sel-precio]").forEach((el) => (el.textContent = formatoUSD(p.precioCentavos)));
  $$("[data-sel-nombre]").forEach((el) => (el.textContent = p.nombre));
  limpiarError("paquete");
}

document.addEventListener("change", (ev) => {
  const t = ev.target as HTMLInputElement;
  if (t.matches?.("input[data-paquete]")) fijarPaquete(t.value);
});

/* ================================================================ disponibilidad real */

function aplicarDisponibilidad() {
  $$<HTMLInputElement>("input[data-paquete]").forEach((i) => {
    const p = paquetePorId(i.value, PROD);
    i.disabled = !p || !paqueteDisponible(p, disp);
  });
  const stock = $$("[data-stock]");
  if (disp.agotado) {
    stock.forEach((s) => {
      s.setAttribute("data-agotado", "");
      const t = $("[data-stock-texto]", s);
      if (t) t.textContent = "Agotado por ahora. Escríbenos por WhatsApp para saber cuándo vuelve a estar disponible.";
    });
    $$<HTMLAnchorElement>("[data-abrir-pedido]").forEach((a) => {
      a.removeAttribute("data-abrir-pedido");
      a.textContent = "Agotado · Consultar por WhatsApp";
    });
    return;
  }
  if (disp.mostrarCifra && disp.actualizadoEl) {
    stock.forEach((s) => {
      s.setAttribute("data-cifra", "");
      const c = $("[data-stock-cifra]", s);
      if (c) c.textContent = `${disp.frascos} frasco${disp.frascos === 1 ? "" : "s"} disponibles (actualizado el ${fechaCortaEcuador(new Date(disp.actualizadoEl!))}). `;
    });
  }
  // Si el paquete preseleccionado no alcanza con el stock real, se cambia y SE AVISA.
  const p = paqueteActual();
  if (!paqueteDisponible(p, disp)) {
    const alternativa = PAQUETES.find((x) => paqueteDisponible(x, disp));
    if (alternativa) {
      fijarPaquete(alternativa.id);
      $$("[data-aviso-paquete]").forEach((el) => {
        el.hidden = false;
        el.setAttribute("data-alerta", "");
        el.textContent = `Por stock limitado, el paquete de ${p.nombre} no está disponible. Hemos seleccionado ${alternativa.nombre}.`;
      });
    }
  }
}

/* ================================================================ detección de modalidad */

let modoPromesa: Promise<Modo> | null = null;
function detectarModo(): Promise<Modo> {
  if (modoPromesa) return modoPromesa;
  modoPromesa = (async () => {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 3500);
      const r = await fetch(API, { headers: { accept: "application/json" }, signal: ctrl.signal, cache: "no-store" });
      clearTimeout(t);
      if (r.ok && (r.headers.get("content-type") ?? "").includes("json")) {
        const j = (await r.json()) as { activo?: boolean; turnstileSiteKey?: string | null };
        if (j.activo) {
          estado.turnstileSiteKey = j.turnstileSiteKey ?? null;
          return (estado.modo = "servidor");
        }
      }
    } catch { /* sin servidor */ }
    return (estado.modo = "whatsapp");
  })();
  return modoPromesa;
}

/* ================================================================ diálogo */

const dlg = $<HTMLDialogElement>("#dlg-pedido");
const form = $<HTMLFormElement>("#form-pedido");

function irPaso(n: 1 | 2 | 3) {
  if (!dlg) return;
  $$("[data-paso]", dlg).forEach((el) => (el.hidden = el.dataset.paso !== String(n)));
  $$("[data-indicador]", dlg).forEach((el) => {
    if (el.dataset.indicador === String(n)) el.setAttribute("aria-current", "step");
    else el.removeAttribute("aria-current");
  });
  const body = $(`[data-paso="${n}"] .sheet__body`, dlg);
  if (body) body.scrollTop = 0;
}

function abrir() {
  if (!dlg || dlg.open) return;
  if (disp.agotado) return;
  if (estado.numero && $("[data-resultado='ok']", dlg)?.hidden === false) reiniciar();
  irPaso(1);
  if (!estado.abiertoEn) estado.abiertoEn = Date.now();
  dlg.showModal();
  document.documentElement.style.overflow = "hidden";
  history.pushState({ pedido: true }, "", "#pedido");
  void detectarModo();
  rastrear("InitiateCheckout", { value: paqueteActual().precioCentavos / 100, currency: "USD", num_items: paqueteActual().frascos });
}

function cerrar() {
  if (!dlg?.open) return;
  dlg.close();
}

dlg?.addEventListener("close", () => {
  document.documentElement.style.overflow = "";
  if (history.state?.pedido) history.back();
});
window.addEventListener("popstate", () => { if (dlg?.open) dlg.close(); });
dlg?.addEventListener("click", (ev) => {
  const t = ev.target as Element;
  if (t === dlg) cerrar(); // clic en el fondo
  if (t.closest("[data-cerrar]")) cerrar();
});

document.addEventListener("click", (ev) => {
  const a = (ev.target as Element).closest<HTMLElement>("[data-abrir-pedido]");
  if (!a || !dlg) return; // sin diálogo, el enlace lleva a WhatsApp
  ev.preventDefault();
  abrir();
});

/* ================================================================ paso 1: validación */

function limpiarError(campo: string) {
  const f = $(`[data-campo="${campo}"]`, dlg ?? document);
  if (!f) return;
  f.removeAttribute("data-error");
  const e = $(`#e-${campo}`);
  if (e) e.textContent = "";
  $$("input, select, textarea", f).forEach((i) => i.removeAttribute("aria-invalid"));
}

function mostrarErrores(errores: Partial<Record<Campo, string>>) {
  let primero: HTMLElement | null = null;
  for (const [campo, msg] of Object.entries(errores)) {
    const f = $(`[data-campo="${campo}"]`, dlg!);
    if (!f) continue;
    f.setAttribute("data-error", "");
    const e = $(`#e-${campo}`);
    if (e) e.textContent = msg!;
    const input = $<HTMLElement>("input:not([type=radio]), select, textarea", f) ?? $<HTMLElement>("input", f);
    input?.setAttribute("aria-invalid", "true");
    primero ??= input;
  }
  primero?.focus();
  primero?.scrollIntoView({ block: "center", behavior: "smooth" });
}

form?.addEventListener("input", (ev) => {
  const t = ev.target as HTMLInputElement;
  if (t.name) limpiarError(t.name === "paquete-dialogo" ? "paquete" : t.name);
});

$<HTMLSelectElement>("#f-provincia")?.addEventListener("change", (ev) => {
  const prov = (ev.target as HTMLSelectElement).value;
  const hint = $("[data-envio-hint]");
  if (hint) hint.textContent = prov ? `Envío a ${prov}: ${textoEnvio(costoEnvio(prov, PROD.envio))}.` : "Elige tu provincia para ver el costo de envío.";
});

function leerFormulario() {
  const fd = new FormData(form!);
  return {
    nombre: fd.get("nombre"),
    celular: fd.get("celular"),
    provincia: fd.get("provincia"),
    ciudad: fd.get("ciudad"),
    direccion: fd.get("direccion"),
    referencia: fd.get("referencia"),
    paquete: estado.paquete,
    acepta: fd.get("acepta") === "on",
  };
}

form?.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const v = validarPedido(leerFormulario(), { disponibilidad: disp, producto: PROD });
  if (!v.ok || !v.paquete) return mostrarErrores(v.errores);
  const btn = $<HTMLButtonElement>("[data-btn-revisar]");
  const textoBtn = btn?.innerHTML ?? "";
  if (btn) { btn.disabled = true; btn.textContent = "Un momento…"; }
  await detectarModo();
  if (btn) { btn.disabled = false; btn.innerHTML = textoBtn; }
  estado.datos = v.datos;
  if (!estado.numero) { estado.fecha = new Date(); estado.numero = numeroPedido(estado.fecha, aleatorio); }
  pintarRevision(v.paquete, v.datos);
  irPaso(2);
});

/* ================================================================ paso 2: revisión */

function fila(dt: string, dd: string, clase = "") {
  const d = document.createElement("div");
  if (clase) d.className = clase;
  const a = document.createElement("dt");
  a.textContent = dt;
  const b = document.createElement("dd");
  b.textContent = dd;
  d.append(a, b);
  return d;
}

function mensajeWhatsApp(p: Paquete, datos: DatosPedido) {
  return mensajePedido({ numero: estado.numero, fecha: estado.fecha, datos, paquete: p, prueba: TIENDA.estado !== "operativa", producto: PROD });
}

function pintarRevision(p: Paquete, datos: DatosPedido) {
  const t = totalPedido(p, datos.provincia, PROD.envio);
  $("[data-resumen-pedido]")?.replaceChildren(
    fila("Producto", PROD.ficha.nombreCompleto),
    fila("Cantidad", `${p.nombre} (${p.capsulas} cápsulas)`),
    fila("Precio del paquete", formatoUSD(p.precioCentavos)),
    fila("Envío", t.envio.estado === "definido" ? textoEnvio(t.envio) : "Por confirmar"),
    fila("Total a pagar al recibir", textoTotal(t), "total"),
  );
  $("[data-resumen-entrega]")?.replaceChildren(
    fila("Nombre", datos.nombre),
    fila("Celular", celularVisible(datos.celular)),
    fila("Destino", `${datos.ciudad}, ${datos.provincia}`),
    fila("Dirección", datos.direccion),
    fila("Referencia", datos.referencia),
  );
  const alerta = $("[data-alerta-envio]");
  if (alerta) {
    alerta.hidden = t.envio.estado === "definido";
    const txt = $("[data-alerta-envio-texto]");
    if (txt)
      txt.textContent = `El costo de envío a ${datos.provincia} se confirma por WhatsApp antes del despacho. Solo enviamos tu pedido cuando aceptes el total final (${formatoUSD(p.precioCentavos)} + envío).`;
  }
  const errorEnvio = $("[data-error-envio]");
  if (errorEnvio) errorEnvio.hidden = true;
  configurarBotonFinal(p, datos);
}

function configurarBotonFinal(p: Paquete, datos: DatosPedido) {
  const confirmar = $<HTMLButtonElement>("[data-confirmar]")!;
  const wa = $<HTMLAnchorElement>("[data-enviar-wa]")!;
  const aviso = $("[data-alerta-modo]")!;
  const servidor = estado.modo === "servidor";
  confirmar.hidden = !servidor;
  wa.hidden = servidor;
  aviso.hidden = servidor;
  wa.href = enlaceWhatsApp(mensajeWhatsApp(p, datos));
  if (servidor && estado.turnstileSiteKey) montarTurnstile();
  else confirmar.disabled = false;
}

$("[data-volver]")?.addEventListener("click", () => irPaso(1));

/* WhatsApp prellenado: el cliente debe pulsar «Enviar» en WhatsApp. */
function pasarAWhatsApp() {
  const p = paqueteActual();
  const url = enlaceWhatsApp(mensajeWhatsApp(p, estado.datos!));
  $$<HTMLAnchorElement>("[data-wa-reabrir]").forEach((a) => (a.href = url));
  $$("[data-resultado]").forEach((el) => (el.hidden = el.dataset.resultado !== "wa"));
  $$("[data-resultado='wa'] [data-numero]").forEach((el) => (el.textContent = `Pedido ${estado.numero}`));
  irPaso(3);
  rastrear("Lead", { value: p.precioCentavos / 100, currency: "USD" });
}

$("[data-enviar-wa]")?.addEventListener("click", () => setTimeout(pasarAWhatsApp, 300));

/* ================================================================ Turnstile (opcional) */

let turnstileCargado: Promise<void> | null = null;
function montarTurnstile() {
  const cont = $("[data-turnstile]");
  const confirmar = $<HTMLButtonElement>("[data-confirmar]")!;
  if (!cont || !estado.turnstileSiteKey) return;
  confirmar.disabled = !estado.turnstileToken;
  turnstileCargado ??= new Promise((ok, mal) => {
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.async = true;
    s.onload = () => ok();
    s.onerror = () => mal();
    document.head.append(s);
  });
  turnstileCargado
    .then(() => {
      const ts = (window as unknown as { turnstile?: { render: (el: Element, o: object) => void } }).turnstile;
      if (!ts || cont.childElementCount) return;
      ts.render(cont, {
        sitekey: estado.turnstileSiteKey,
        language: "es",
        callback: (token: string) => { estado.turnstileToken = token; confirmar.disabled = false; },
        "expired-callback": () => { estado.turnstileToken = ""; confirmar.disabled = true; },
      });
    })
    .catch(() => { confirmar.disabled = false; });
}

/* ================================================================ envío al servidor */

function mostrarFallo(texto: string, ofrecerWhatsApp: boolean) {
  const e = $("[data-error-envio]");
  if (e) { e.hidden = false; e.textContent = texto; }
  if (ofrecerWhatsApp && estado.datos) {
    estado.modo = "whatsapp";
    configurarBotonFinal(paqueteActual(), estado.datos);
  }
}

$("[data-confirmar]")?.addEventListener("click", async () => {
  if (estado.enviando || !estado.datos) return;
  const btn = $<HTMLButtonElement>("[data-confirmar]")!;
  const html = btn.innerHTML;
  estado.enviando = true;
  btn.disabled = true;
  btn.textContent = "Registrando tu pedido…";
  const fd = new FormData(form!);
  try {
    const r = await fetch(API, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        ...estado.datos,
        producto: PROD.id,
        paquete: estado.paquete,
        acepta: true,
        clave: estado.clave,
        transcurridoMs: Date.now() - estado.abiertoEn,
        empresa_web: fd.get("empresa_web") ?? "",
        turnstile: estado.turnstileToken,
      }),
    });
    const j = (await r.json().catch(() => ({}))) as { ok?: boolean; numero?: string; notificado?: boolean; codigo?: string; errores?: Partial<Record<Campo, string>> };
    if (r.ok && j.ok && j.numero) return exito(j.numero, Boolean(j.notificado));
    if (r.status === 422 && j.errores) { irPaso(1); return mostrarErrores(j.errores); }
    if (j.codigo === "VERIFICACION") return mostrarFallo("No pudimos verificar que eres una persona. Inténtalo de nuevo o envía tu pedido por WhatsApp.", true);
    if (r.status === 429) return mostrarFallo("Recibimos demasiados intentos desde tu conexión. Envía tu pedido por WhatsApp:", true);
    return mostrarFallo("No pudimos registrar tu pedido en línea (no se ha guardado). Puedes enviarlo por WhatsApp:", true);
  } catch {
    return mostrarFallo("Sin conexión con el servidor: tu pedido no se ha guardado. Puedes enviarlo por WhatsApp:", true);
  } finally {
    estado.enviando = false;
    btn.innerHTML = html;
    btn.disabled = false;
  }
});

function exito(numero: string, notificado: boolean) {
  const p = paqueteActual();
  estado.numero = numero;
  $$("[data-resultado]").forEach((el) => (el.hidden = el.dataset.resultado !== "ok"));
  $$("[data-resultado='ok'] [data-numero]").forEach((el) => (el.textContent = numero));
  $$("[data-celular]").forEach((el) => (el.textContent = celularVisible(estado.datos!.celular)));
  const respaldo = $<HTMLAnchorElement>("[data-wa-respaldo]");
  if (respaldo) {
    respaldo.hidden = notificado;
    respaldo.href = enlaceWhatsApp(mensajeWhatsApp(p, estado.datos!));
  }
  irPaso(3);
  $<HTMLElement>("[data-resultado='ok']")?.focus();
  rastrear("Purchase", { value: p.precioCentavos / 100, currency: "USD", num_items: p.frascos });
}

function reiniciar() {
  form?.reset();
  estado.clave = nuevaClave();
  estado.numero = "";
  estado.datos = null;
  estado.abiertoEn = Date.now();
  fijarPaquete(estado.paquete);
}

/* ================================================================ barra fija (móvil) */

function barraFija() {
  const barra = $("[data-sticky]");
  const vigilados = $$("[data-oculta-barra]");
  if (!barra || !("IntersectionObserver" in window)) return;
  const visibles = new Set<Element>();
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => (e.isIntersecting ? visibles.add(e.target) : visibles.delete(e.target)));
    const mostrar = visibles.size === 0 && window.scrollY > 300;
    barra.toggleAttribute("data-visible", mostrar);
    document.body.toggleAttribute("data-sticky", mostrar);
    barra.setAttribute("aria-hidden", mostrar ? "false" : "true");
    $$<HTMLElement>("a, button", barra).forEach((el) => (el.tabIndex = mostrar ? 0 : -1));
  });
  vigilados.forEach((v) => io.observe(v));
}

/* ================================================================ inicio */

fijarPaquete(estado.paquete);
aplicarDisponibilidad();
barraFija();
if (location.hash === "#pedido") history.replaceState(null, "", location.pathname);
