import { TIENDA } from "../config/tienda.ts";
import { PRODUCTO, DIAS_POR_FRASCO, textoDuracion } from "../config/producto.ts";
import { formatoUSD } from "../lib/pedido.ts";
import { ruta } from "../lib/ruta.ts";

const envio = TIENDA.envio;

/** Preguntas frecuentes. El HTML permitido es solo <a> y <strong> escritos aquí. */
export const FAQ: { p: string; r: string }[] = [
  {
    p: "¿Qué es TESTO-GH?",
    r: `Según su envase, TESTO-GH (${PRODUCTO.marca}) es un <strong>multivitamínico para hombres</strong> (Multi Vitamin For Men) en cápsulas. Cada frasco trae <strong>${PRODUCTO.capsulasPorFrasco} cápsulas</strong>.${PRODUCTO.ingredientes ? ` Ingredientes: ${PRODUCTO.ingredientes}` : ""}`,
  },
  {
    p: "¿Cómo se toma?",
    r: PRODUCTO.modoDeUso
      ? `Según la etiqueta: <strong>${PRODUCTO.modoDeUso}</strong> No superes la dosis recomendada.`
      : "Sigue siempre el modo de uso impreso en la etiqueta del frasco y no superes la dosis recomendada. Si tienes dudas, escríbenos por WhatsApp antes de comprar.",
  },
  ...(DIAS_POR_FRASCO
    ? [{
        p: "¿Cuánto me dura un frasco?",
        r: `Con la dosis de la etiqueta, un frasco de ${PRODUCTO.capsulasPorFrasco} cápsulas rinde <strong>${DIAS_POR_FRASCO} días</strong>. El paquete de 2 frascos rinde <strong>${DIAS_POR_FRASCO * 2} días</strong>.`,
      }]
    : PRODUCTO.duracionProveedor
      ? [{
          p: "¿Cuánto me dura un frasco?",
          r: `Según el proveedor, el frasco de ${PRODUCTO.capsulasPorFrasco} cápsulas rinde <strong>${textoDuracion(1)}</strong>; el paquete de 2 frascos, <strong>${textoDuracion(2)}</strong>. La duración exacta depende del modo de uso impreso en la etiqueta, que siempre debes seguir.`,
        }]
      : []),
  {
    p: "¿Qué resultados puedo esperar?",
    r: "Es un suplemento alimenticio que complementa tu alimentación; no es un medicamento y no promete resultados específicos. La respuesta a cualquier suplemento varía de una persona a otra y depende también de tu alimentación, descanso y entrenamiento. Si buscas tratar una condición de salud, consulta a un médico.",
  },
  {
    p: "¿Quién no debe tomarlo?",
    r: PRODUCTO.advertencias.length
      ? `Según la etiqueta: ${PRODUCTO.advertencias.join(" ")}`
      : "Es un producto para hombres adultos. No es para menores de edad ni para mujeres embarazadas o en período de lactancia. Si tomas algún medicamento o tienes una condición de salud, consulta a tu médico antes de consumirlo.",
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
    r: `Sí, con el frasco cerrado y el sello intacto, dentro del plazo legal. Si recibes un producto dañado, equivocado o con el sello roto, lo cambiamos sin costo. Revisa la <a href="${ruta("/devoluciones/")}">política de cambios y devoluciones</a>.`,
  },
  {
    p: "¿Quién fabrica el producto y quién lo vende?",
    r: `TESTO-GH es de la marca <strong>${PRODUCTO.marca}</strong>${PRODUCTO.fabricante ? `, fabricado por <strong>${PRODUCTO.fabricante}</strong>` : ""}. REVIVE GROW es la tienda que lo comercializa en línea en Ecuador; no somos el fabricante.`,
  },
];

if (TIENDA.sanitario.notificacionSanitaria)
  FAQ.push({
    p: "¿Tiene Notificación Sanitaria?",
    r: `Sí. Notificación Sanitaria ARCSA: <strong>${TIENDA.sanitario.notificacionSanitaria}</strong>.`,
  });
