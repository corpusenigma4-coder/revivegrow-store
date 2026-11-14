/**
 * Control antes del lanzamiento: lista todo lo que impide vender de forma legal y honesta.
 *   npm run check:launch          → informe (código 1 si hay pendientes)
 *   node scripts/launch-check.mjs --guardia → se ejecuta antes de cada build: solo FALLA si la
 *     tienda está en "operativa" con pendientes (impide publicar una tienda operativa incompleta).
 */
import { TIENDA } from "../src/config/tienda.ts";
import { INVENTARIO } from "../src/config/inventario.ts";
import { PRODUCTO, VERIFICACION_PRODUCTO } from "../src/config/producto.ts";
import { VERIFICACION_FLO } from "../src/config/producto-flo.ts";
import { pendientesLegales } from "../src/data/legal.ts";

const guardia = process.argv.includes("--guardia");
const p = [];
const add = (area, msg) => p.push(`[${area}] ${msg}`);
const s = TIENDA.sanitario;

if (!s.notificacionSanitaria) add("ARCSA", "Número de Notificación Sanitaria del producto no verificado (tienda.ts → sanitario.notificacionSanitaria)");
if (!s.verificadoEl) add("ARCSA", "Fecha de verificación de la Notificación Sanitaria en ARCSA");
if (!s.publicidadRevisada) add("ARCSA", "Revisión de los textos publicitarios frente a la normativa ARCSA vigente (sanitario.publicidadRevisada)");
if (!s.caducidadLoteEnVenta) add("producto", "Caducidad del lote en venta sin confirmar (pedir foto del lote al proveedor)");
if (!VERIFICACION_PRODUCTO.fotosRealesRecibidas) add("producto", "Fotos reales del frasco físico: la imagen recibida tiene textos sin sentido (posible imagen generada por IA)");
if (!VERIFICACION_PRODUCTO.etiquetaCoincideConNotificacion) add("producto", "Confirmar que la etiqueta aprobada por ARCSA coincide con el frasco (leyendas 'Increase Testosterone', 'Increase Muscle Mass', 'Support Libido')");
if (!VERIFICACION_PRODUCTO.composicionRevisada) add("producto", "Revisar la composición: sin hormonas ni sustancias prohibidas");
if (!PRODUCTO.ingredientes && !PRODUCTO.activos.length) add("producto", "Composición e ingredientes de la etiqueta posterior (producto.ts)");
if (!PRODUCTO.modoDeUso) add("producto", "Modo de uso / dosis de la etiqueta (producto.ts)");
if (!PRODUCTO.porcion && PRODUCTO.duracionProveedor) add("producto", `Duración "${PRODUCTO.duracionProveedor.texto} por frasco" es dato del proveedor: confirmarla con la dosis de la etiqueta (producto.ts → porcion)`);
if (!PRODUCTO.advertencias.length) add("producto", "Advertencias de la etiqueta (producto.ts)");
if (!PRODUCTO.fabricante) add("producto", "Fabricante o titular del producto (producto.ts)");
else if (new Date(`${s.caducidadLoteEnVenta}-01`) <= new Date()) add("producto", `El lote en venta caduca en ${s.caducidadLoteEnVenta}: no vender producto vencido`);
if (!VERIFICACION_FLO.notificacionSanitaria) add("FLO", "Notificación Sanitaria ARCSA e importador de FLO Ovarian Support (producto importado)");
if (!VERIFICACION_FLO.caducidadLote) add("FLO", "Caducidad del lote de FLO en venta");
if (!VERIFICACION_FLO.fuenteResenas) add("FLO", "Fuente documentada de las 4 reseñas (enlace o captura de la plataforma original y fecha)");
if (!VERIFICACION_FLO.publicidadRevisada) add("FLO", "Revisión ARCSA de los textos y de las reseñas (mencionan efectos en la salud: vello, período, piel)");
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
