# Mini Dreams — V1 (previsualización)

Boutique infantil: ropa y disfraces adorables para bebés. Web estática (HTML + CSS + JS), sin frameworks ni build step.

> **Estado:** versión de previsualización. Sin checkout real, sin trackers, sin precios inventados. Pendiente de aprobación antes de publicar.

## Estructura

```
index.html        Página principal (hero, categorías, catálogo, sección emocional, footer)
privacy.html      Política de privacidad (en preparación)
styles.css        Estilos de marca (mobile-first, paleta Mini Dreams)
main.js           Lógica: catálogo, filtros, búsqueda, PDP, galería, lightbox, carrito
data/products.js  FUENTE ÚNICA de productos y categorías
assets/
  brand/logo/     Para el logo definitivo (PNG/SVG)
  products/<slug>/ Fotos reales de cada producto (una carpeta por producto)
  ui/             Elementos de interfaz (placeholder.svg)
CNAME             Dominio (revivegrow.store) — MIGRACIÓN PENDIENTE a dominio Mini Dreams
.nojekyll         Necesario para GitHub Pages con carpetas
```

## Cómo añadir / completar un producto

Todo se edita en **un solo lugar**: `data/products.js`.

1. Copia un objeto del array `PRODUCTS` y cambia `id` y `slug` (únicos, sin espacios).
2. Guarda las fotos en `assets/products/<slug>/` con nombres descriptivos:
   `patito-principal.webp`, `patito-frontal.webp`, `patito-lateral.webp`, `patito-trasera.webp`, `patito-detalle.webp`.
3. Apunta esas rutas en `images`.
4. Cuando el precio y las tallas estén confirmados:
   - `price`: número en **USD** (ej. `24.90`)
   - `sizes`: array (ej. `["0-3m", "3-6m", "6-12m"]`)
   - `stockStatus: "available"`

Mientras `stockStatus` no sea `"available"` (o falten precio/tallas), el producto se muestra como **en preparación** y **no se puede comprar**. Si una imagen falta o falla, se muestra un marcador neutro — nunca una foto de otro producto.

## Pendiente (ver respuesta del chat para la lista completa)

- Logo definitivo, fotografías reales, precios/tallas en USD.
- Checkout real (deshabilitado en V1).
- Textos legales, contacto, FAQ, envíos y devoluciones.
- Migración de dominio a la identidad definitiva de Mini Dreams.
