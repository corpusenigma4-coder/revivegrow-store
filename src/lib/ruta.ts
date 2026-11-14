/**
 * Prefija una ruta interna con la base del sitio (GitHub Pages puede servirlo en /revivegrow-store/).
 * Funciona también fuera de Astro (pruebas en Node), donde la base es "/".
 */
const BASE: string = ((import.meta as unknown as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? "/").replace(/\/$/, "");

export function ruta(p: string): string {
  return `${BASE}${p.startsWith("/") ? p : `/${p}`}`;
}
