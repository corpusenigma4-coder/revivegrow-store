import { TIENDA } from "../config/tienda";

/** En vista previa se bloquea la indexación; en "operativa" se permite automáticamente. */
export function GET() {
  const cuerpo =
    TIENDA.estado === "operativa"
      ? `User-agent: *\nAllow: /\nDisallow: /api/\n`
      : `# Vista previa: indexación desactivada hasta el lanzamiento.\nUser-agent: *\nDisallow: /\n`;
  return new Response(cuerpo, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
