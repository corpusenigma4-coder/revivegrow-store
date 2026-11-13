import { TIENDA } from "../config/tienda.ts";
import { PRODUCTO, DIAS_POR_FRASCO } from "../config/producto.ts";
import { formatoUSD } from "../lib/pedido.ts";

const envio = TIENDA.envio;

/** Preguntas frecuentes. El HTML permitido es solo <a> y <strong> escritos aquí. */
export const FAQ: { p: string; r: string }[] = [
  {
    p: "¿Qué es exactamente este producto?",
    r: `${PRODUCTO.descripcionEtiqueta} Cada frasco trae ${PRODUCTO.capsulasPorFrasco} cápsulas de ${PRODUCTO.mgPorCapsula} mg. Está dirigido a hombres mayores de 19 años, según su etiqueta.`,
  },
  {
    p: "¿Cómo se toma?",
    r: `Según la etiqueta: <strong>1 cápsula tres veces al día, después de las principales comidas</strong> (desayuno, almuerzo y cena). No superes la dosis recomendada.`,
  },
  {
    p: "¿Cuánto me dura un frasco?",
    r: `Con la dosis de la etiqueta (3 cápsulas al día), un frasco de ${PRODUCTO.capsulasPorFrasco} cápsulas rinde <strong>${DIAS_POR_FRASCO} días</strong>. El paquete de 2 frascos rinde <strong>${DIAS_POR_FRASCO * 2} días</strong>.`,
  },
  {
    p: "¿Qué resultados puedo esperar?",
    r: "Es un suplemento alimenticio que complementa tu alimentación; no es un medicamento y no promete resultados específicos. La respuesta a cualquier suplemento varía de una persona a otra. Si buscas tratar una condición de salud, consulta a un médico.",
  },
  {
    p: "¿Quién no debe tomarlo?",
    r: "Según la etiqueta, no es apto para mujeres embarazadas o en período de lactancia ni para niños. Si tomas algún medicamento, consulta a tu médico antes de consumirlo. Contiene lactosa.",
  },
  {
    p: "¿Cómo funciona el pago contra entrega?",
    r: "Haces tu pedido aquí sin pagar nada. Te confirmamos el pedido y el total por WhatsApp, y <strong>pagas cuando recibes el producto</strong>. No pedimos tarjeta ni datos bancarios.",
  },
  {
    p: "¿Cuánto cuesta el envío?",
    r:
      envio.costoCentavos === null
        ? "Te informamos el costo exacto de envío a tu ciudad por WhatsApp <strong>antes de despachar</strong>. Solo enviamos el pedido cuando aceptas el total final."
        : envio.costoCentavos === 0
          ? "El envío es gratis."
          : `El envío cuesta ${formatoUSD(envio.costoCentavos)}${Object.keys(envio.porProvincia).length ? " (algunas provincias tienen tarifa especial)" : ""}. Lo verás en el resumen antes de confirmar.`,
  },
  {
    p: "¿Cuánto tarda en llegar?",
    r: envio.plazo
      ? `El plazo estimado es de ${envio.plazo}, desde que confirmamos tu pedido.`
      : "Depende de tu ciudad. Te confirmamos el plazo estimado por WhatsApp al confirmar tu pedido.",
  },
  {
    p: "¿Puedo devolverlo?",
    r: 'Sí, con el frasco cerrado y el sello intacto, dentro del plazo legal. Si recibes un producto dañado, equivocado o con el sello roto, lo cambiamos sin costo. Revisa la <a href="/devoluciones/">política de cambios y devoluciones</a>.',
  },
  {
    p: "¿Quién fabrica el producto y quién lo vende?",
    r: `Según la etiqueta, lo elabora y distribuye <strong>${PRODUCTO.fabricante}</strong>. REVIVE GROW es la tienda que lo comercializa en línea; no somos el fabricante.`,
  },
];

if (TIENDA.sanitario.notificacionSanitaria)
  FAQ.push({
    p: "¿Tiene Notificación Sanitaria?",
    r: `Sí. Notificación Sanitaria ARCSA: <strong>${TIENDA.sanitario.notificacionSanitaria}</strong>.`,
  });
