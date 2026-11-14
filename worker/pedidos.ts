/**
 * Servidor de pedidos como Cloudflare Worker independiente.
 * Úsalo cuando la web está en GitHub Pages (revivegrow.store), que no ejecuta código de servidor:
 * la web envía los pedidos a este Worker (TIENDA.apiPedidos), que los guarda en D1 y avisa por
 * WhatsApp Cloud API. Misma lógica y mismas pruebas que functions/api/pedido.ts.
 * Despliegue: ver docs/CONFIGURACION.md («Pedidos con la web en GitHub Pages»).
 */
import { estadoServicio, origenPermitido, recibirPedido, type Entorno } from "../src/server/pedidos.ts";

function conCors(res: Response, origen: string | null): Response {
  if (!origen) return res;
  const h = new Headers(res.headers);
  h.set("access-control-allow-origin", origen);
  h.set("vary", "Origin");
  return new Response(res.body, { status: res.status, headers: h });
}

export default {
  async fetch(req: Request, env: Entorno): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname !== "/api/pedido") return new Response("No encontrado", { status: 404 });
    const origen = req.headers.get("origin");
    const permitido = origen && origenPermitido(origen, req, env) ? origen : null;

    if (req.method === "OPTIONS") {
      if (!permitido) return new Response(null, { status: 403 });
      return new Response(null, {
        status: 204,
        headers: {
          "access-control-allow-origin": permitido,
          "access-control-allow-methods": "GET, POST, OPTIONS",
          "access-control-allow-headers": "content-type, accept",
          "access-control-max-age": "86400",
          vary: "Origin",
        },
      });
    }
    if (req.method === "GET") return conCors(estadoServicio(env), permitido);
    if (req.method === "POST") return conCors(await recibirPedido(req, env), permitido);
    return new Response("Método no permitido", { status: 405 });
  },
};
