// @ts-check
import { defineConfig } from "astro/config";

// Sitio estático. Se publica en GitHub Pages (.github/workflows/pages.yml), que pasa su URL y su
// subcarpeta con SITE_URL y BASE_PATH; en Cloudflare Pages / revivegrow.ec se usan los valores por defecto.
// La recepción de pedidos (functions/api/pedido.ts) solo funciona en Cloudflare Pages; en GitHub Pages
// la página usa automáticamente WhatsApp con mensaje prellenado.
const base = process.env.BASE_PATH ? `${process.env.BASE_PATH.replace(/\/$/, "")}/` : "/";
export default defineConfig({
  site: process.env.SITE_URL || "https://revivegrow.ec",
  base,
  trailingSlash: "ignore",
  build: { format: "directory", assets: "assets", inlineStylesheets: "always" },
  compressHTML: true,
  devToolbar: { enabled: false },
});
