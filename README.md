# Mini Dreams — V2 (previsualización)

Boutique infantil: ropa y disfraces adorables para bebés. Web estática (HTML + CSS + JS), sin frameworks ni build step.

> **Estado:** previsualización. Checkout PayPal **desactivado** por seguridad (ver abajo), sin precios reales, sin trackers. Pendiente de aprobación antes de publicar.

## Estructura

```
index.html        Home: hero, categorías, catálogo, sección emocional, footer
producto.html     Página individual de producto (?slug=patito, ?slug=conejito, …)
privacy.html      Privacidad (en preparación)
styles.css        Estilos de marca (mobile-first, boutique premium)

data/products.js  FUENTE ÚNICA de productos y categorías
store.js          Núcleo compartido: helpers de producto, carrito, header/menú/búsqueda/toast
paypal.js         Integración PayPal (recuperada de ReviveGrow, adaptada a USD + carrito)
catalog.js        Lógica de la home (categorías, filtros, búsqueda, tarjetas)
product.js        Lógica de la página de producto (galería, tallas, cantidad, relacionados)

assets/
  brand/logo/     Logo definitivo (PNG/SVG)
  products/<slug>/ Fotos reales por producto
  ui/             placeholder.svg (imagen neutra de respaldo)
CNAME             Dominio (revivegrow.store) — MIGRACIÓN PENDIENTE
.nojekyll         Necesario para GitHub Pages con carpetas
```

## Páginas individuales de producto

Cada producto tiene su **propia URL compartible**: `producto.html?slug=<slug>`.
Funciona al abrir directamente, al recargar y con atrás/adelante del navegador.
En el catálogo, **la tarjeta entera** (foto, nombre y "Ver producto") enlaza a esa página.

## Modelo de datos (data/products.js)

Cada producto admite: nombre, categoría, etiqueta, `descShort`, `descLong`,
`images` (main/front/back/side/details), `price` (USD), `sizes`, `availability`,
`materials`, `care`, `sizeGuide`.

- **Tallas**: array de `{ label, stock }`. Solo las de `stock > 0` son seleccionables;
  las agotadas se muestran tachadas. No se puede comprar sin elegir una talla válida.
- **Comprable** solo si `availability: "in-stock"` + `price` numérico + alguna talla con stock.
  Si no, se muestra como **en preparación** y no se puede comprar.
- **Datos de desarrollo**: el producto marcado `__dev: true` (ahora: *patito*) usa datos
  de PRUEBA (no reales) para poder verificar tallas/carrito/PayPal. Quitar `__dev` y poner
  datos reales antes de vender.

## PayPal — estado y seguridad

La integración del lado del cliente se recuperó de ReviveGrow y se adaptó a **USD + carrito
multi-artículo con tallas y cantidades**. Está **desactivada** (`CONFIG.enabled = false` en
`paypal.js`): en previsualización se muestra el botón de pago como "en preparación" y **no se
inicia ninguna transacción**.

Motivo: un checkout 100% client-side no puede verificar el precio del pedido de forma fiable.
Para producción se necesita una función de servidor que cree/capture la orden validando precios
contra el catálogo y guardando el secreto de PayPal como variable de entorno (nunca en el
frontend). La propuesta está documentada en `paypal.js` (bloque NOTA_SERVIDOR).

## Pendiente

- Logo definitivo, fotos reales, precios/tallas/materiales/cuidados/guía reales en USD.
- Backend de verificación de pedidos + activar PayPal (sandbox primero).
- Textos legales, contacto, FAQ, envíos y devoluciones.
- Migración de dominio a la identidad definitiva de Mini Dreams.
