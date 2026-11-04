// @ts-check
import { defineConfig } from "astro/config";

// Site statique (phase 1). L'adaptateur serveur (Cloudflare Pages Functions)
// sera ajouté en phase 3 pour la création / capture des commandes PayPal.
export default defineConfig({
  site: "https://revivegrow.store",
  trailingSlash: "never",
  build: { format: "file", inlineStylesheets: "auto" },
  compressHTML: true,
  image: { layout: "constrained", responsiveStyles: true },
  devToolbar: { enabled: false },
});
