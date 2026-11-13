# REVIVE GROW Ecuador — landing de venta contra entrega

Landing de **Maca Negra + L-Arginina 600 mg** (30 cápsulas) para Ecuador: español, USD, pago contra entrega,
pedidos por WhatsApp. Dominio previsto: **revivegrow.ec** · hosting: **Cloudflare Pages**.

> **Estado: vista previa.** `noindex`, aviso visible y pedidos marcados como PRUEBA hasta completar los
> requisitos sanitarios y comerciales (`npm run check:launch`). Ver [docs/CUMPLIMIENTO.md](docs/CUMPLIMIENTO.md).

## Oferta
| Paquete | Precio | Detalle |
|---|---|---|
| 2 frascos (destacado, preseleccionado) | **$37,40** | $18,70 c/u · ahorro real $17,40 (31,8 %) frente a 2 × $27,40 = $54,80 · 20 días |
| 1 frasco | $27,40 | 10 días (dosis de etiqueta: 3 cápsulas/día) |

## Uso
```bash
npm ci
npm run dev           # http://localhost:4321
npm test              # unitarias (cálculos, validación, servidor con SQLite) + build + navegador
npm run check:launch  # pendientes antes del lanzamiento
```

## Dónde se edita
- `src/config/tienda.ts` — precios, envío, pago, datos del vendedor, estado, píxel de Meta.
- `src/config/inventario.ts` — unidades reales disponibles (nunca bajan solas).
- `src/config/producto.ts` — ficha transcrita de la etiqueta.
- `src/data/faq.ts`, `src/data/legal.ts` — preguntas y páginas legales (`{{P:…}}` = dato pendiente).

## Arquitectura
| Capa | Elección |
|---|---|
| Sitio | Astro 7 estático, CSS propio, ~1 script pequeño; Archivo Variable autoalojada; imágenes AVIF/WebP |
| Pedidos (A, activo) | WhatsApp con mensaje prellenado; el cliente pulsa «Enviar» (se le indica claramente) |
| Pedidos (B, preparado) | `functions/api/pedido.ts` (Cloudflare Pages Functions) → D1 + aviso por WhatsApp Cloud API oficial |
| Seguridad | Cabeceras CSP/HSTS (`public/_headers`), trampa anti-bots, límite por IP, anti-duplicados, Turnstile opcional |
| Pruebas | `tests/unit` (node:test) y `tests/e2e/run.mjs` (Playwright, iPhone 13 y escritorio) |

Configuración de Cloudflare, D1, WhatsApp y Turnstile: [docs/CONFIGURACION.md](docs/CONFIGURACION.md).

## Historial
Este repositorio contenía la tienda francesa anterior de REVIVE GROW (almohada cervical, PayPal, GitHub Pages).
Sigue intacta en la rama `main` (commit `9c5e974`) y en el historial; sus imágenes y documentos se conservan en
`assets-sources/archivo-tienda-fr/` y `docs/archivo-tienda-fr/`. Los flujos de publicación en GitHub Pages y el
diagnóstico de PayPal se retiraron de esta rama para no publicar la nueva landing en el dominio anterior.
