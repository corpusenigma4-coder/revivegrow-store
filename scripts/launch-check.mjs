/**
 * Control antes del lanzamiento: lista todo lo que impide vender de forma legal y honesta.
 *   npm run check:launch          → informe (código 1 si hay pendientes)
 *   node scripts/launch-check.mjs --guardia → se ejecuta antes de cada build: solo FALLA si la
 *     tienda está en "operativa" con pendientes (impide publicar una tienda operativa incompleta).
 */
import { TIENDA } from "../src/config/tienda.ts";
import { INVENTARIO } from "../src/config/inventario.ts";
import { pendientesLegales } from "../src/data/legal.ts";

const guardia = process.argv.includes("--guardia");
const p = [];
const add = (area, msg) => p.push(`[${area}] ${msg}`);
const s = TIENDA.sanitario;

if (!s.notificacionSanitaria) add("ARCSA", "Número de Notificación Sanitaria del producto no verificado (tienda.ts → sanitario.notificacionSanitaria)");
if (!s.verificadoEl) add("ARCSA", "Fecha de verificación de la Notificación Sanitaria en ARCSA");
if (!s.publicidadRevisada) add("ARCSA", "Revisión de los textos publicitarios frente a la normativa ARCSA vigente (sanitario.publicidadRevisada)");
if (!s.caducidadLoteEnVenta) add("producto", "Caducidad del lote en venta sin confirmar (la unidad fotografiada indica EXP: AGO 2026)");
else if (new Date(`${s.caducidadLoteEnVenta}-01`) <= new Date()) add("producto", `El lote en venta caduca en ${s.caducidadLoteEnVenta}: no vender producto vencido`);
for (const [k, v] of Object.entries(TIENDA.empresa)) if (!v && k !== "correo") add("empresa", `Dato administrativo pendiente: empresa.${k}`);
if (TIENDA.envio.costoCentavos === null && !Object.keys(TIENDA.envio.porProvincia).length) add("envío", "Costo de envío sin definir (se comunica por WhatsApp; aceptable, pero confírmalo)");
if (!TIENDA.envio.courier) add("envío", "Empresa de mensajería sin definir");
if (!TIENDA.pago.formasAlRecibir) add("pago", "Formas de pago al recibir sin definir");
if (TIENDA.pago.preciosIncluyenIva === null) add("impuestos", "Confirmar si los precios incluyen IVA y el comprobante que se emite");
if (INVENTARIO.frascos === null) add("stock", "Unidades disponibles sin informar (opcional: sin cifra solo se muestra 'unidades limitadas')");
for (const x of pendientesLegales()) add(`legal:${x.pagina}`, x.texto);

if (guardia) {
  if (TIENDA.estado === "operativa" && p.length) {
    console.error(`✖ La tienda está en "operativa" pero hay ${p.length} pendiente(s). Corrígelos o vuelve a "vista-previa":\n` + p.map((x) => "  • " + x).join("\n"));
    process.exit(1);
  }
  console.log(`Estado de la tienda: ${TIENDA.estado}${p.length ? ` · ${p.length} pendiente(s) antes del lanzamiento (npm run check:launch)` : ""}`);
  process.exit(0);
}
console.log(p.length ? `${p.length} pendiente(s) antes del lanzamiento:\n` + p.map((x) => "  • " + x).join("\n") : "Sin pendientes: lista para lanzamiento.");
process.exit(p.length ? 1 : 0);
