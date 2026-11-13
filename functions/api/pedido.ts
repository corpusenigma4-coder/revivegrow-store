/**
 * Cloudflare Pages Function: /api/pedido
 * La lógica está en src/server/pedidos.ts (probada con `npm run test:unit`).
 */
import { estadoServicio, recibirPedido, type Entorno } from "../../src/server/pedidos.ts";

interface Contexto {
  request: Request;
  env: Entorno;
}

export const onRequestGet = ({ env }: Contexto) => estadoServicio(env);
export const onRequestPost = ({ request, env }: Contexto) => recibirPedido(request, env);
