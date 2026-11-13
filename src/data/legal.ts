/**
 * Páginas legales (Ecuador). Los datos que faltan se marcan con {{P:descripción}}:
 * se muestran resaltados en la página y `npm run check:launch` los lista como pendientes.
 * Marco de referencia: Ley Orgánica de Defensa del Consumidor (LODC), Ley Orgánica de Protección
 * de Datos Personales (LOPDP, 2021), Ley de Comercio Electrónico, Firmas y Mensajes de Datos,
 * normativa ARCSA de suplementos alimenticios. Revisión por un abogado recomendada antes del lanzamiento.
 */
import { TIENDA } from "../config/tienda.ts";
import { PRODUCTO } from "../config/producto.ts";
import { formatoUSD } from "../lib/pedido.ts";

const P = (txt: string) => `{{P:${txt}}}`;
const v = (valor: string | null | undefined, falta: string) => (valor ? valor : P(falta));

const e = TIENDA.empresa;
const vendedor = `${v(e.razonSocial, "nombre o razón social del vendedor según el RUC")}, con RUC ${v(e.ruc, "número de RUC")} y domicilio en ${v(e.domicilio, "domicilio")}`;
const contacto = `WhatsApp ${TIENDA.whatsapp.visible}${e.correo ? ` o correo ${e.correo}` : ""}`;

const envio = TIENDA.envio;
const textoCostoEnvio =
  envio.costoCentavos === null
    ? `El costo de envío ${P("definir tarifa de envío (src/config/tienda.ts → envio.costoCentavos)")} se informa por WhatsApp antes del despacho, y el pedido solo se despacha cuando el cliente acepta el total final.`
    : envio.costoCentavos === 0
      ? "El envío no tiene costo para el cliente."
      : `El costo de envío es de ${formatoUSD(envio.costoCentavos)}${Object.keys(envio.porProvincia).length ? ", salvo en las provincias con tarifa especial que se indican al hacer el pedido" : ""}. Se muestra en el resumen antes de confirmar.`;

const formasPago = TIENDA.pago.formasAlRecibir?.length
  ? `Formas de pago aceptadas al recibir: ${TIENDA.pago.formasAlRecibir.join(", ")}.`
  : `Formas de pago aceptadas al recibir: ${P("confirmar con la empresa de mensajería (efectivo, transferencia, etc.)")}.`;

const iva =
  TIENDA.pago.preciosIncluyenIva === null
    ? P("confirmar con el contador si los precios incluyen IVA y el tipo de comprobante de venta que se emite")
    : TIENDA.pago.preciosIncluyenIva
      ? "Los precios incluyen IVA."
      : "Los precios no incluyen IVA; el valor del impuesto se detalla en el comprobante.";

export interface Seccion { titulo: string; parrafos: string[]; lista?: string[] }
export interface PaginaLegal { slug: string; titulo: string; descripcion: string; secciones: Seccion[] }

export const LEGAL: PaginaLegal[] = [
  {
    slug: "privacidad",
    titulo: "Política de privacidad",
    descripcion: "Cómo REVIVE GROW trata los datos personales de quienes hacen pedidos en revivegrow.ec.",
    secciones: [
      {
        titulo: "Responsable del tratamiento",
        parrafos: [
          `El responsable del tratamiento de tus datos es ${vendedor}. Puedes contactarnos por ${contacto}.`,
          "Esta política se rige por la Ley Orgánica de Protección de Datos Personales del Ecuador (LOPDP) y su reglamento.",
        ],
      },
      {
        titulo: "Qué datos recogemos",
        parrafos: ["Solo los necesarios para gestionar y entregar tu pedido:"],
        lista: [
          "Nombre y apellido.",
          "Número de celular.",
          "Provincia, ciudad o cantón, dirección y referencia de entrega.",
          "Paquete elegido, número y fecha del pedido.",
          "Datos técnicos mínimos para evitar abusos (por ejemplo, un identificador anónimo derivado de la dirección IP, que no permite conocer la IP original).",
        ],
      },
      {
        titulo: "Para qué los usamos",
        parrafos: [
          "Para registrar tu pedido, confirmarlo contigo por WhatsApp o llamada, coordinar la entrega con la empresa de mensajería, cobrar contra entrega y atender cambios, devoluciones o reclamos.",
          "La base para tratarlos es la ejecución del contrato de compraventa que solicitas y tu consentimiento, que otorgas al marcar la casilla de aceptación. No usamos tus datos para publicidad ni los vendemos.",
        ],
      },
      {
        titulo: "Con quién los compartimos",
        parrafos: [
          `Con la empresa de mensajería que realiza la entrega (${v(envio.courier, "nombre de la empresa de mensajería")}), solo con los datos de entrega.`,
          TIENDA.privacidad.proveedorRecibeDatos === null
            ? `Con el proveedor del producto, si realiza el despacho por cuenta de la tienda: ${P("confirmar si NOVA SHOP recibe los datos del cliente para despachar")}.`
            : TIENDA.privacidad.proveedorRecibeDatos
              ? "Con el proveedor del producto, que realiza el despacho por cuenta de la tienda, solo con los datos de entrega."
              : "El proveedor del producto no recibe tus datos personales.",
          "Con proveedores tecnológicos que alojan el sitio y procesan los mensajes: Cloudflare (alojamiento y base de datos de pedidos) y Meta Platforms (WhatsApp). Estos servicios pueden almacenar datos fuera del Ecuador, con las garantías previstas en sus condiciones de servicio.",
          "Con autoridades, cuando una ley lo exija.",
        ],
      },
      {
        titulo: "Cuánto tiempo los conservamos",
        parrafos: [
          `Conservamos los datos del pedido durante ${v(TIENDA.privacidad.plazoConservacion, "plazo de conservación (por ejemplo, el exigido por la normativa tributaria)")}. Después se eliminan o anonimizan.`,
        ],
      },
      {
        titulo: "Tus derechos",
        parrafos: [
          `Puedes ejercer tus derechos de acceso, rectificación y actualización, eliminación, oposición, portabilidad y suspensión del tratamiento escribiéndonos por ${contacto}. Responderemos en los plazos que establece la LOPDP. También puedes acudir a la Superintendencia de Protección de Datos Personales.`,
        ],
      },
      {
        titulo: "Seguridad",
        parrafos: [
          "El sitio usa conexión cifrada (HTTPS). Los pedidos se guardan en una base de datos privada a la que no se accede desde la web pública. No solicitamos datos de tarjetas ni bancarios.",
        ],
      },
      {
        titulo: "Cookies y medición publicitaria",
        parrafos: [
          TIENDA.metaPixelId
            ? "Usamos el píxel de Meta para medir la eficacia de nuestros anuncios (visitas, inicio de pedido y pedidos realizados). No enviamos a Meta tu nombre, celular ni dirección."
            : "Actualmente el sitio no usa cookies publicitarias ni herramientas de seguimiento de terceros. Si en el futuro activamos el píxel de Meta para medir nuestros anuncios, lo indicaremos en esta sección.",
        ],
      },
      {
        titulo: "Menores de edad",
        parrafos: ["Este sitio y el producto están dirigidos a adultos. No recogemos a sabiendas datos de menores de edad."],
      },
    ],
  },
  {
    slug: "terminos",
    titulo: "Términos y condiciones",
    descripcion: "Condiciones de venta de REVIVE GROW en Ecuador con pago contra entrega.",
    secciones: [
      {
        titulo: "Quién vende",
        parrafos: [
          `La tienda revivegrow.ec es operada por ${vendedor}. REVIVE GROW comercializa el producto ${PRODUCTO.nombreCompleto}, de la marca ${PRODUCTO.marca}, fabricado por ${v(PRODUCTO.fabricante, "fabricante o titular según la etiqueta posterior y la Notificación Sanitaria")}. REVIVE GROW no es el fabricante ni el titular de la marca.`,
        ],
      },
      {
        titulo: "Producto",
        parrafos: [
          `${PRODUCTO.tipo} (Multi Vitamin For Men, según el envase). Frasco de ${PRODUCTO.capsulasPorFrasco} cápsulas. Composición: ${v(PRODUCTO.ingredientes, "lista de ingredientes y cantidades de la etiqueta posterior")}. ${TIENDA.sanitario.notificacionSanitaria ? `Notificación Sanitaria: ${TIENDA.sanitario.notificacionSanitaria}.` : `Notificación Sanitaria: ${P("número de Notificación Sanitaria ARCSA verificado")}.`}`,
          "Es un suplemento alimenticio: no es un medicamento y no sustituye una alimentación variada ni un tratamiento médico. Lee la etiqueta, las advertencias y el modo de uso antes de consumirlo.",
        ],
      },
      {
        titulo: "Precios",
        parrafos: [
          "Los precios están expresados en dólares de los Estados Unidos (USD) y son los publicados en el sitio al momento del pedido. El ahorro del paquete de 2 frascos se calcula frente a la compra de 2 frascos individuales al precio publicado.",
          iva,
          textoCostoEnvio,
        ],
      },
      {
        titulo: "Cómo se forma el pedido",
        parrafos: [
          "1) Eliges el paquete y completas tus datos de entrega. 2) Revisas el resumen y envías el pedido. 3) Te contactamos por WhatsApp o llamada para confirmar el pedido, el costo de envío y el total. 4) La compra se perfecciona cuando confirmas el total final. Puedes cancelar sin costo antes del despacho.",
          "Podemos rechazar o cancelar pedidos con datos incompletos o falsos, sin cobertura de entrega o cuando no haya unidades disponibles; en ese caso te avisaremos.",
        ],
      },
      {
        titulo: "Pago contra entrega",
        parrafos: [
          "No se realizan pagos anticipados ni se solicitan datos de tarjeta o bancarios en el sitio. Pagas el total confirmado al recibir el producto.",
          formasPago,
          "Antes de pagar puedes verificar que el paquete corresponde a tu pedido y que el sello de seguridad del frasco está intacto.",
        ],
      },
      {
        titulo: "Disponibilidad",
        parrafos: [
          "Las unidades son limitadas y las ofertas están sujetas a disponibilidad. Si un producto se agota después de tu pedido, te lo informaremos y no se realizará ningún cobro.",
        ],
      },
      {
        titulo: "Cambios, devoluciones y reclamos",
        parrafos: ["Consulta la página de cambios y devoluciones. Los reclamos se atienden por WhatsApp y conforme a la Ley Orgánica de Defensa del Consumidor."],
      },
      {
        titulo: "Uso del producto",
        parrafos: [
          `Modo de uso: ${v(PRODUCTO.modoDeUso, "modo de uso literal de la etiqueta")} No superar la dosis recomendada. No apto para mujeres embarazadas o en período de lactancia ni para niños. Si tomas algún medicamento, consulta a tu médico antes de consumirlo.`,
          "No garantizamos resultados específicos: la respuesta a un suplemento varía de una persona a otra.",
        ],
      },
      {
        titulo: "Ley aplicable",
        parrafos: [
          "Estos términos se rigen por las leyes de la República del Ecuador, en particular la Ley Orgánica de Defensa del Consumidor y la Ley de Comercio Electrónico, Firmas Electrónicas y Mensajes de Datos.",
        ],
      },
    ],
  },
  {
    slug: "envios",
    titulo: "Envíos y entregas",
    descripcion: "Cobertura, costos y plazos de entrega de REVIVE GROW con pago contra entrega en Ecuador.",
    secciones: [
      {
        titulo: "Cobertura",
        parrafos: [
          envio.sinCobertura.length
            ? `Entregamos con pago contra entrega en el Ecuador continental, excepto en: ${envio.sinCobertura.join(", ")}. ${P("confirmar cobertura exacta con la empresa de mensajería")}`
            : `Cobertura de entrega con pago contra entrega: ${P("confirmar provincias y ciudades atendidas por la empresa de mensajería")}. Si tu localidad no tiene cobertura, te avisaremos por WhatsApp antes de despachar.`,
        ],
      },
      { titulo: "Costo de envío", parrafos: [textoCostoEnvio] },
      {
        titulo: "Plazos",
        parrafos: [
          envio.plazo
            ? `Plazo estimado de entrega: ${envio.plazo}, contados desde la confirmación del pedido. Es un plazo estimado y puede variar por causas ajenas a la tienda.`
            : `Plazo estimado de entrega: ${P("plazo según la empresa de mensajería")}. Te lo confirmaremos por WhatsApp según tu ciudad.`,
        ],
      },
      {
        titulo: "Empresa de mensajería",
        parrafos: [`Las entregas las realiza ${v(envio.courier, "nombre de la empresa de mensajería")}.`],
      },
      {
        titulo: "Al recibir",
        parrafos: [
          "Verifica que el paquete esté cerrado y que el sello de seguridad del frasco esté intacto. Si el sello está roto o falta, no lo consumas y escríbenos por WhatsApp.",
          `Si no se logra la entrega: ${P("número de intentos de entrega y qué ocurre si el cliente no está")}.`,
        ],
      },
    ],
  },
  {
    slug: "devoluciones",
    titulo: "Cambios y devoluciones",
    descripcion: "Derecho de devolución y cambios de REVIVE GROW conforme a la Ley Orgánica de Defensa del Consumidor.",
    secciones: [
      {
        titulo: "Derecho de devolución",
        parrafos: [
          `Por tratarse de una venta a distancia (internet, WhatsApp o teléfono), tienes derecho a devolver el producto dentro del plazo que establece el artículo 45 de la Ley Orgánica de Defensa del Consumidor, contado desde que lo recibes, siempre que el producto no haya sido utilizado ni deteriorado. ${P("verificar con un abogado el plazo vigente del art. 45 LODC (el texto consultado indica tres días)")}`,
          "Por tratarse de un producto de consumo, para devolverlo el frasco debe estar cerrado y con el sello de seguridad intacto.",
        ],
      },
      {
        titulo: "Producto defectuoso, equivocado o con sello roto",
        parrafos: [
          "Si recibes un producto distinto al pedido, dañado, con el sello de seguridad roto o vencido, escríbenos por WhatsApp con una foto del producto y del lote. Lo cambiaremos o te devolveremos el dinero, sin costo para ti.",
        ],
      },
      {
        titulo: "Cómo solicitarlo",
        parrafos: [
          `Escríbenos por WhatsApp al ${TIENDA.whatsapp.visible} indicando tu número de pedido. Te indicaremos cómo hacernos llegar el producto.`,
          `Costo del envío de la devolución por arrepentimiento: ${v(TIENDA.devoluciones.costoEnvioDevolucion, "quién asume el costo del envío de la devolución")}.`,
          `Reembolso: ${v(TIENDA.devoluciones.formaReembolso, "forma y plazo del reembolso")}.`,
        ],
      },
    ],
  },
];

/** Todas las marcas de dato pendiente presentes en las páginas legales. */
export function pendientesLegales(): { pagina: string; texto: string }[] {
  const out: { pagina: string; texto: string }[] = [];
  for (const pg of LEGAL)
    for (const s of pg.secciones)
      for (const t of [...s.parrafos, ...(s.lista ?? [])]) for (const m of t.matchAll(/\{\{P:(.+?)\}\}/g)) out.push({ pagina: pg.slug, texto: m[1] });
  return out;
}
