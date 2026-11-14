import { CATALOGO } from "../config/catalogo.ts";
import { ruta } from "../lib/ruta.ts";

const flo = CATALOGO.flo;
const dias = flo.diasPorFrasco ?? 30;
const envio = flo.envio;

/** Preguntas frecuentes de FLO. HTML permitido: <a> y <strong> escritos aquí. */
export const FAQ_FLO: { p: string; r: string }[] = [
  {
    p: "¿Qué es FLO Ovarian Support?",
    r: "Es un suplemento alimenticio de la marca O Positiv Health en <strong>cápsulas veganas</strong>, con mio-inositol, D-quiro-inositol, DIM y folato. Cada frasco trae <strong>90 cápsulas</strong>.",
  },
  {
    p: "¿Cómo se toma?",
    r: "Según la etiqueta: <strong>3 cápsulas una vez al día con agua</strong>, o según las indicaciones de un profesional de la salud.",
  },
  {
    p: "¿Cuánto me dura un frasco?",
    r: `Con la dosis de la etiqueta, un frasco rinde <strong>${dias} días</strong>. El paquete de 2 frascos te cubre <strong>${dias * 2} días</strong> sin interrupciones.`,
  },
  {
    p: "¿Sirve para los cólicos menstruales?",
    r: "FLO no es un analgésico ni un medicamento para el dolor menstrual. Sus ingredientes se han estudiado sobre todo en relación con el equilibrio del ciclo y la función ovárica. Si tus cólicos son intensos, cambian o no te dejan hacer tu vida, consulta a tu ginecóloga: tu bienestar va primero.",
  },
  {
    p: "¿Es un tratamiento para el SOP (ovario poliquístico)?",
    r: "No es un tratamiento para el SOP ni para ninguna enfermedad. El mio-inositol y el D-quiro-inositol se han estudiado en mujeres con SOP; si tienes un diagnóstico o estás en tratamiento, habla con tu médico antes de tomarlo.",
  },
  {
    p: "¿Cuándo voy a notar algo?",
    r: "Cada cuerpo es distinto y no podemos prometer resultados ni plazos. En los estudios con inositoles, los efectos suelen evaluarse tras varios meses de uso constante, por eso conviene mantener la rutina diaria.",
  },
  {
    p: "¿Puedo tomarlo si uso anticonceptivos o tomo medicamentos?",
    r: "Consulta primero con tu médico, sobre todo si usas anticonceptivos hormonales, tratamientos hormonales o de fertilidad, o medicamentos para la glucosa.",
  },
  {
    p: "¿Puedo tomarlo si estoy embarazada o dando de lactar?",
    r: "No lo tomes durante el embarazo o la lactancia sin indicación de tu médico.",
  },
  {
    p: "¿Es vegano?",
    r: "Sí: las cápsulas son vegetales (celulosa). La marca lo presenta como 100 % vegano, sin OGM y sin gluten.",
  },
  {
    p: "¿Cómo funciona el pago contra entrega?",
    r: "Haces tu pedido aquí sin pagar nada. Te confirmamos por WhatsApp y <strong>pagas cuando recibes el producto</strong>. No pedimos tarjeta ni datos bancarios.",
  },
  {
    p: "¿Cuánto cuesta el envío?",
    r: envio.costoCentavos === 0 ? "<strong>Nada: el envío es totalmente gratis.</strong> Pagas solo el precio del paquete al recibirlo." : "Te lo confirmamos por WhatsApp antes de despachar.",
  },
  {
    p: "¿Cuánto tarda en llegar?",
    r: envio.plazo ? `El plazo estimado es de ${envio.plazo}, desde que confirmamos tu pedido.` : "Depende de tu ciudad. Te confirmamos el plazo estimado por WhatsApp al confirmar tu pedido.",
  },
  {
    p: "¿Puedo devolverlo?",
    r: `Sí, con el frasco cerrado y el sello intacto, dentro del plazo legal. Si recibes un producto dañado, equivocado o con el sello roto, lo cambiamos sin costo. Revisa la <a href="${ruta("/devoluciones/")}">política de cambios y devoluciones</a>.`,
  },
  {
    p: "¿Quién fabrica el producto y quién lo vende?",
    r: "FLO Ovarian Support es de la marca <strong>O Positiv Health</strong>. REVIVE GROW es la tienda que lo comercializa en línea en Ecuador; no somos el fabricante.",
  },
];
