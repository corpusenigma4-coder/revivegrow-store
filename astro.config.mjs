// @ts-check
import { defineConfig } from "astro/config";

// Site 100 % statique, publié sur GitHub Pages avec le domaine personnalisé revivegrow.store.
// - build.format "file" : /contact → contact.html (GitHub Pages sert les URL sans extension) ;
// - build.assets "assets" : pas de dossier commençant par « _ » (ignoré par Jekyll) ;
// - aucune fonction serveur : paiement et commandes passent par des services externes (docs/).
export default defineConfig({
  site: "https://revivegrow.store",
  trailingSlash: "never",
  build: { format: "file", assets: "assets", inlineStylesheets: "auto" },
  compressHTML: true,
  image: { layout: "constrained", responsiveStyles: true },
  devToolbar: { enabled: false },
});
