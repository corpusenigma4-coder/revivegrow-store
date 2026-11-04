# REVIVE GROW — tienda online (Francia metropolitana)

Marca premium de descanso. Sitio en **francés de Francia**, precios en **EUR TTC**.
Dirección creativa: **« Le calme, pensé dans le détail »**.

> Estado: **Fase 2**, solo vista previa. `noindex` activo, **ningún pago activo** y la producción (`main` / GitHub Pages) intacta.

## Puesta en marcha

```bash
npm ci
npm run dev          # http://localhost:4321
npm test             # unitarios + build + navegador (Playwright/Chromium)
npm run check:launch # lista lo que bloquea el lanzamiento
```

## Arquitectura

| Capa | Elección |
|---|---|
| Framework | Astro 7 (estático, islas JS mínimas), TypeScript estricto |
| Tipografías | Cormorant Garamond (títulos) + Instrument Sans Variable (UI), autoalojadas vía Fontsource |
| Imágenes | `astro:assets`: AVIF/WebP responsive, generadas en el build |
| Hosting | **GitHub Pages** (estático, dominio revivegrow.store), publicación manual: `.github/workflows/deploy-pages.yml` |
| Pagos | Botón alojado de PayPal u API externa: ver `docs/PAIEMENTS-ET-COMMANDES.md` |
| Contacto | Email directo + formulario Formspree (se activa con `CONTACT.formEndpoint`) |

```
src/
  config/      site.ts · campaign.ts (fechas reales, hora de París) · product.ts (specs con verified:false)
  lib/         campaign.ts (fases, cuenta atrás, testeado) · format.ts (precios/fechas FR)
  components/  Header, CampaignBar, Countdown, BuyBox, PackList, HeightConfigurator, PillowPlan,
               Gallery, SupplierProof, Services, Faq, StickyBuy, Button, Price, Pending, Icon, Logo
  layouts/     Base.astro (SEO, OG, robots, fase de campaña antes del primer render)
  pages/       index · oreiller-cervical-ajustable · [legal] (9 páginas) · systeme · 404
  data/        faq.ts · legal.ts
assets-sources/  imágenes originales entregadas (sin modificar)
tests/unit       campaña y formatos (node:test)
tests/e2e        Playwright: páginas, enlaces, campaña con reloj simulado, interacciones, capturas
scripts/         launch-check.mjs
docs/            PLAN-MAESTRO.md
```

## Reglas de honestidad comercial (aplicadas en código y en tests)

- Sin precio tachado ni «−40 %» mientras `CAMPAIGN.referencePrice.evidence` sea `null` (art. L112-1-1 C. conso).
- Campaña configurable en `src/config/campaign.ts`: `enabled` la activa o desactiva; sin `endsAt` se muestra «durée limitée» sin fecha ni cuenta atrás; con `endsAt` aparecen la fecha real y la cuenta atrás, que se para al final.
- Sin stock inventado, sin compradores ficticios, sin opiniones inventadas.
- Las cifras 4,9/5 y +3.000 clientes se atribuyen al fabricante, sin datos estructurados `AggregateRating`.
- Toda especificación no confirmada lleva `verified: false` y se muestra como «À confirmer» en la vista previa.

## Copias de seguridad (F0)

- Rama `archive/mini-dreams` → `1db5c44` (estado de `main` antes de REVIVE GROW).
- Rama `archive/revivegrow-uk` → `d1581ac` (tienda original del deshumidificador).
- El historial completo se conserva; esta rama solo retira los archivos de Mini Dreams de su árbol de trabajo.
