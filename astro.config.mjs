// @ts-check
import { defineConfig } from "astro/config";

// Sitio estático (Cloudflare Pages). La recepción de pedidos vive en functions/api/pedido.ts
// (Cloudflare Pages Functions), que Cloudflare compila aparte: no hace falta adaptador.
export default defineConfig({
  site: "https://revivegrow.ec",
  trailingSlash: "ignore",
  build: { format: "directory", assets: "assets", inlineStylesheets: "always" },
  compressHTML: true,
  devToolbar: { enabled: false },
});
