/**
 * Serveur statique qui reproduit la résolution d'URL de GitHub Pages :
 *  /            → index.html
 *  /contact     → contact.html (URL sans extension)
 *  /dossier/    → dossier/index.html
 *  introuvable  → 404.html avec statut 404
 * Permet de vérifier les liens et ressources tels qu'ils seront servis sur revivegrow.store.
 */
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname, normalize } from "node:path";

const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".webp": "image/webp", ".avif": "image/avif", ".png": "image/png", ".jpg": "image/jpeg", ".woff2": "font/woff2", ".woff": "font/woff", ".txt": "text/plain", ".json": "application/json", ".xml": "application/xml" };

async function isFile(p) { try { return (await stat(p)).isFile(); } catch { return false; } }

export function startPagesServer(root, port) {
  const server = createServer(async (req, res) => {
    const url = new URL(req.url, "http://x");
    let p = decodeURIComponent(url.pathname);
    if (p.includes("..")) { res.writeHead(400).end(); return; }
    const base = normalize(join(root, p));
    const candidates = p.endsWith("/") ? [join(base, "index.html")] : [base, base + ".html", join(base, "index.html")];
    for (const c of candidates) {
      if (await isFile(c)) {
        res.writeHead(200, { "content-type": TYPES[extname(c)] ?? "application/octet-stream" });
        res.end(await readFile(c)); return;
      }
    }
    res.writeHead(404, { "content-type": TYPES[".html"] });
    res.end(await readFile(join(root, "404.html")).catch(() => "404"));
  });
  return new Promise((resolve) => server.listen(port, "127.0.0.1", () => resolve(server)));
}
