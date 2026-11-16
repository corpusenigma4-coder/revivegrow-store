import { CATALOGO } from "../config/catalogo.ts";
import { VERIFICACION_CINTURON } from "../config/producto-cinturon.ts";
import { ruta } from "../lib/ruta.ts";

const envio = CATALOGO.cinturon.envio;
const v = VERIFICACION_CINTURON;

/** Preguntas frecuentes del cinturón. HTML permitido: <a> y <strong> escritos aquí. */
export const FAQ_CINTURON: { p: string; r: string }[] = [
  {
    p: "¿Cómo funciona?",
    r: "Es una banda de felpa que envuelves en tu abdomen. Tiene elementos de calefacción integrados y función de masaje por vibración. Con el botón integrado lo enciendes y seleccionas las funciones.",
  },
  {
    p: "¿Puedo elegir solo calor o solo masaje?",
    r: v.nivelesYModos
      ? v.nivelesYModos
      : "El cinturón ofrece calor y masaje (vibración), y el nivel de calor se ajusta desde el botón. La forma exacta de cambiar de función está en el manual que acompaña al producto; si tienes dudas antes de comprar, escríbenos por WhatsApp.",
  },
  {
    p: "¿Cómo se alimenta? ¿Tiene batería?",
    r: "Funciona con <strong>alimentación USB de 5 V</strong>. La conexión va dentro de un bolsillo interior, donde puedes guardar, por ejemplo, una batería externa (power bank) mientras lo usas. Funciona conectado a esa fuente USB.",
  },
  {
    p: "¿Qué incluye la caja?",
    r: v.accesoriosIncluidos
      ? `Un cinturón JY-2678 y ${v.accesoriosIncluidos}.`
      : "Un cinturón térmico con masaje JY-2678 por unidad. Te confirmamos por WhatsApp los accesorios incluidos antes de despachar tu pedido.",
  },
  {
    p: "¿A qué medida se ajusta?",
    r: "Es una banda envolvente de <strong>100 cm de largo y 20 cm de alto</strong>, ajustable con cierre de velcro. Colócalo cómodo, <strong>sin apretar</strong>.",
  },
  {
    p: "¿Sirve para los días del periodo?",
    r: "Puedes usarlo como parte de tu rutina de autocuidado y confort, también en esos días. Es un accesorio de calor y masaje, no un dispositivo médico ni un tratamiento. Si tienes dolor intenso o diferente a lo habitual, consulta a tu médico.",
  },
  {
    p: "¿Cómo lo cuido o lo limpio?",
    r: v.cuidados
      ? v.cuidados
      : "Desconéctalo antes de limpiarlo y mantén siempre secas las partes eléctricas (botón, cable y conexión). Sigue las indicaciones de limpieza del manual.",
  },
  {
    p: "¿Cuánto cuesta el envío y cómo pago?",
    r: envio.costoCentavos === 0
      ? "<strong>El envío es totalmente gratis</strong> y <strong>pagas al recibir</strong> el producto. No pedimos tarjeta ni datos bancarios."
      : "Te confirmamos el envío por WhatsApp y pagas al recibir.",
  },
  {
    p: "¿Cuánto tarda en llegar?",
    r: envio.plazo ? `El plazo estimado es de ${envio.plazo}, desde que confirmamos tu pedido.` : "Depende de tu ciudad. Te confirmamos el plazo estimado por WhatsApp al confirmar tu pedido.",
  },
  {
    p: "¿Puedo devolverlo?",
    r: `Sí, sin usar y en su empaque, dentro del plazo legal. Si llega dañado o no funciona, lo cambiamos sin costo. Revisa la <a href="${ruta("/devoluciones/")}">política de cambios y devoluciones</a>.`,
  },
];
