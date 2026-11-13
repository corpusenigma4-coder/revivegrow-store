/**
 * Lógica de pedidos SIN dependencias: la usan el navegador, la función del servidor
 * (functions/api/pedido.ts) y las pruebas. Todos los importes van en centavos.
 */
import { PAQUETES, TIENDA } from "../config/tienda.ts";
import { PRODUCTO, DIAS_POR_FRASCO } from "../config/producto.ts";
import { PROVINCIAS } from "./provincias.ts";

export type Paquete = (typeof PAQUETES)[number];
export type PaqueteId = Paquete["id"];

/* ---------------------------------------------------------------- dinero */

/** 3740 → "$37,40" · 123456 → "$1.234,56" (formato usado en Ecuador). */
export function formatoUSD(centavos: number): string {
  const negativo = centavos < 0;
  const abs = Math.abs(Math.round(centavos));
  const enteros = Math.floor(abs / 100)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const dec = (abs % 100).toString().padStart(2, "0");
  return `${negativo ? "-" : ""}$${enteros},${dec}`;
}

/** 31.7518 → "31,8 %" */
export function formatoPorcentaje(valor: number, decimales = 1): string {
  return `${valor.toFixed(decimales).replace(".", ",")} %`;
}

export function paquetePorId(id: string): Paquete | undefined {
  return PAQUETES.find((p) => p.id === id);
}

const UNITARIO = PAQUETES.find((p) => p.frascos === 1)!;

/** Ahorro REAL frente a comprar la misma cantidad de frascos individuales. */
export function ahorroPaquete(p: Paquete) {
  const porSeparado = UNITARIO.precioCentavos * p.frascos;
  const ahorro = porSeparado - p.precioCentavos;
  return {
    porSeparadoCentavos: porSeparado,
    ahorroCentavos: ahorro,
    porcentaje: porSeparado > 0 ? (ahorro / porSeparado) * 100 : 0,
    precioPorFrascoCentavos: Math.round(p.precioCentavos / p.frascos),
  };
}

/** Días de consumo según la dosis de la etiqueta (3 cápsulas al día). */
export function diasDeConsumo(p: Paquete): number {
  return p.frascos * DIAS_POR_FRASCO;
}

export function costoPorDiaCentavos(p: Paquete): number {
  return Math.round(p.precioCentavos / diasDeConsumo(p));
}

/* ---------------------------------------------------------------- envío */

export type Envio =
  | { estado: "definido"; centavos: number }
  | { estado: "por-confirmar" }
  | { estado: "sin-cobertura" };

export function costoEnvio(provincia: string | null | undefined, envio = TIENDA.envio): Envio {
  if (provincia && envio.sinCobertura.includes(provincia)) return { estado: "sin-cobertura" };
  if (provincia && provincia in envio.porProvincia) return { estado: "definido", centavos: envio.porProvincia[provincia] };
  if (envio.costoCentavos === null) return { estado: "por-confirmar" };
  return { estado: "definido", centavos: envio.costoCentavos };
}

export function totalPedido(p: Paquete, provincia: string | null | undefined, envio = TIENDA.envio) {
  const e = costoEnvio(provincia, envio);
  return {
    precioCentavos: p.precioCentavos,
    envio: e,
    totalCentavos: e.estado === "definido" ? p.precioCentavos + e.centavos : null,
  };
}

export function textoEnvio(e: Envio): string {
  if (e.estado === "definido") return e.centavos === 0 ? "Gratis" : formatoUSD(e.centavos);
  if (e.estado === "sin-cobertura") return "Sin cobertura de pago contra entrega";
  return "Por confirmar (te lo informamos por WhatsApp antes del despacho)";
}

export function textoTotal(t: ReturnType<typeof totalPedido>): string {
  return t.totalCentavos !== null ? formatoUSD(t.totalCentavos) : `${formatoUSD(t.precioCentavos)} + envío por confirmar`;
}

/* ---------------------------------------------------------------- disponibilidad */

export interface Inventario {
  frascos: number | null;
  actualizadoEl: string | null;
  diasValidez: number;
}

export function disponibilidad(inv: Inventario, ahora = Date.now()) {
  const fecha = inv.actualizadoEl ? Date.parse(inv.actualizadoEl) : NaN;
  const vigente =
    inv.frascos !== null && Number.isFinite(fecha) && ahora - fecha <= inv.diasValidez * 86_400_000 && fecha <= ahora + 3_600_000;
  // Sin dato vigente no se limita nada: el proveedor confirma por WhatsApp.
  const frascos = vigente ? Math.max(0, Math.floor(inv.frascos!)) : null;
  return {
    mostrarCifra: frascos !== null,
    frascos,
    actualizadoEl: vigente ? fecha : null,
    agotado: frascos === 0,
    maxFrascos: frascos ?? Infinity,
  };
}

export function paqueteDisponible(p: Paquete, d: ReturnType<typeof disponibilidad>): boolean {
  return !d.agotado && p.frascos <= d.maxFrascos;
}

/* ---------------------------------------------------------------- fechas (Ecuador, UTC−5 sin horario de verano) */

const OFFSET_EC = -5 * 60 * 60 * 1000;

function partesEcuador(fecha: Date) {
  const d = new Date(fecha.getTime() + OFFSET_EC);
  const p = (n: number) => n.toString().padStart(2, "0");
  return {
    dd: p(d.getUTCDate()),
    mm: p(d.getUTCMonth() + 1),
    aaaa: d.getUTCFullYear().toString(),
    hh: p(d.getUTCHours()),
    mi: p(d.getUTCMinutes()),
  };
}

/** "13/11/2026 14:05" (hora de Ecuador continental). */
export function fechaEcuador(fecha: Date): string {
  const x = partesEcuador(fecha);
  return `${x.dd}/${x.mm}/${x.aaaa} ${x.hh}:${x.mi}`;
}

export function fechaCortaEcuador(fecha: Date): string {
  const x = partesEcuador(fecha);
  return `${x.dd}/${x.mm}/${x.aaaa}`;
}

/* ---------------------------------------------------------------- número de pedido */

const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin 0/O ni 1/I

/** "RG-261113-7KQ2" · `aleatorio` devuelve enteros 0..255 (crypto.getRandomValues). */
export function numeroPedido(fecha: Date, aleatorio: (n: number) => Uint8Array): string {
  const x = partesEcuador(fecha);
  const bytes = aleatorio(5);
  let sufijo = "";
  for (const b of bytes) sufijo += ALFABETO[b % ALFABETO.length];
  return `RG-${x.aaaa.slice(2)}${x.mm}${x.dd}-${sufijo}`;
}

/* ---------------------------------------------------------------- validación */

export interface DatosPedido {
  nombre: string;
  celular: string;
  provincia: string;
  ciudad: string;
  direccion: string;
  referencia: string;
  paquete: string;
  acepta: boolean;
}

export type Campo = keyof DatosPedido;

/** Quita caracteres de control, espacios repetidos y recorta. */
export function limpiarTexto(valor: unknown, max = 200): string {
  return String(valor ?? "")
    .normalize("NFC")
    .replace(new RegExp("[\\u0000-\\u001f\\u007f-\\u009f\\u200b-\\u200f\\u2028-\\u202e\\u2066-\\u2069]", "g"), " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

/** Acepta 0991234567, 099 123 4567, +593 99 123 4567, 593991234567, 991234567 → "0991234567". */
export function normalizarCelular(valor: unknown): string | null {
  let d = String(valor ?? "").replace(/[^\d+]/g, "");
  if (d.startsWith("+")) d = d.slice(1);
  d = d.replace(/\D/g, "");
  if (d.startsWith("00593")) d = d.slice(5);
  else if (d.startsWith("593")) d = d.slice(3);
  if (d.length === 9 && d.startsWith("9")) d = "0" + d;
  return /^09\d{8}$/.test(d) ? d : null;
}

export function celularInternacional(celular: string): string {
  return "593" + celular.slice(1);
}

export function celularVisible(celular: string): string {
  return `${celular.slice(0, 3)} ${celular.slice(3, 6)} ${celular.slice(6)}`;
}

const LETRAS = /\p{L}/gu;

export function validarPedido(entrada: Partial<Record<Campo, unknown>>, ctx: { disponibilidad?: ReturnType<typeof disponibilidad> } = {}) {
  const errores: Partial<Record<Campo, string>> = {};
  const datos: DatosPedido = {
    nombre: limpiarTexto(entrada.nombre, 80),
    celular: normalizarCelular(entrada.celular) ?? limpiarTexto(entrada.celular, 20),
    provincia: limpiarTexto(entrada.provincia, 40),
    ciudad: limpiarTexto(entrada.ciudad, 60),
    direccion: limpiarTexto(entrada.direccion, 160),
    referencia: limpiarTexto(entrada.referencia, 160),
    paquete: limpiarTexto(entrada.paquete, 10),
    acepta: entrada.acepta === true || entrada.acepta === "true" || entrada.acepta === "on",
  };

  const palabras = datos.nombre.split(" ").filter((w) => (w.match(LETRAS) ?? []).length >= 2);
  if (!datos.nombre) errores.nombre = "Escribe tu nombre y apellido.";
  else if (palabras.length < 2) errores.nombre = "Escribe tu nombre y tu apellido.";
  else if (/[<>{}\\]/.test(datos.nombre)) errores.nombre = "El nombre contiene caracteres no válidos.";

  if (!datos.celular) errores.celular = "Escribe tu número de celular.";
  else if (!normalizarCelular(datos.celular)) errores.celular = "Revisa el número: debe tener 10 dígitos y empezar con 09.";

  if (!datos.provincia) errores.provincia = "Elige tu provincia.";
  else if (!(PROVINCIAS as readonly string[]).includes(datos.provincia)) errores.provincia = "Elige una provincia de la lista.";
  else if (costoEnvio(datos.provincia).estado === "sin-cobertura")
    errores.provincia = "Por ahora no tenemos pago contra entrega en esta provincia. Escríbenos por WhatsApp.";

  if (datos.ciudad.length < 3) errores.ciudad = "Escribe tu ciudad o cantón.";
  if (datos.direccion.length < 8) errores.direccion = "Escribe la dirección completa (calle principal, secundaria y número).";
  if (datos.referencia.length < 4) errores.referencia = "Añade una referencia para el repartidor (color de casa, local cercano…).";

  const paquete = paquetePorId(datos.paquete);
  if (!paquete) errores.paquete = "Elige 1 o 2 frascos.";
  else if (ctx.disponibilidad && !paqueteDisponible(paquete, ctx.disponibilidad))
    errores.paquete = ctx.disponibilidad.agotado
      ? "El producto está agotado en este momento."
      : `Solo quedan ${ctx.disponibilidad.frascos} frasco(s): elige otro paquete.`;

  if (!datos.acepta) errores.acepta = "Debes aceptar los términos y la política de privacidad.";

  return { ok: Object.keys(errores).length === 0, datos, errores, paquete };
}

/* ---------------------------------------------------------------- mensaje */

export interface ResumenPedido {
  numero: string;
  fecha: Date;
  datos: DatosPedido;
  paquete: Paquete;
  prueba?: boolean;
}

/** Texto ordenado del pedido, para WhatsApp (modalidad A) y para el registro. */
export function mensajePedido({ numero, fecha, datos, paquete, prueba }: ResumenPedido): string {
  const t = totalPedido(paquete, datos.provincia);
  const lineas = [
    prueba ? "*PEDIDO DE PRUEBA — tienda en vista previa*" : null,
    `*NUEVO PEDIDO — ${TIENDA.marca}*`,
    `Pedido: ${numero}`,
    `Fecha: ${fechaEcuador(fecha)}`,
    "",
    "*Cliente*",
    `Nombre: ${datos.nombre}`,
    `Celular: ${celularVisible(datos.celular)}`,
    `Provincia: ${datos.provincia}`,
    `Ciudad/cantón: ${datos.ciudad}`,
    `Dirección: ${datos.direccion}`,
    `Referencia: ${datos.referencia}`,
    "",
    "*Pedido*",
    `Producto: ${PRODUCTO.nombreCompleto} (${PRODUCTO.capsulasPorFrasco} cápsulas por frasco)`,
    `Cantidad: ${paquete.nombre} (${paquete.capsulas} cápsulas)`,
    `Precio del paquete: ${formatoUSD(paquete.precioCentavos)}`,
    `Envío: ${t.envio.estado === "definido" ? textoEnvio(t.envio) : "por confirmar"}`,
    `Total: ${textoTotal(t)}`,
    "",
    "Pago: contra entrega (pago al recibir).",
  ];
  return lineas.filter((l) => l !== null).join("\n");
}
