/**
 * CATÁLOGO: productos que se venden en la tienda, cada uno con su landing.
 * Precios en centavos. El servidor recalcula siempre el precio desde aquí.
 */
import { PAQUETES, PAQUETE_INICIAL, TIENDA, type ConfigEnvio } from "./tienda.ts";
import { PRODUCTO, DIAS_POR_FRASCO, type FichaProducto } from "./producto.ts";
import { FICHA_FLO } from "./producto-flo.ts";
import { INVENTARIO, INVENTARIO_FLO } from "./inventario.ts";
import type { Inventario } from "../lib/pedido.ts";

export interface Paquete {
  id: string;
  frascos: number;
  nombre: string;
  capsulas: number;
  precioCentavos: number;
  destacado: boolean;
  cinta: string | null;
}

export type IdProducto = "testo-gh" | "flo";

export interface ProductoVenta {
  id: IdProducto;
  ficha: FichaProducto;
  paquetes: readonly Paquete[];
  paqueteInicial: string;
  envio: ConfigEnvio;
  inventario: Inventario;
  /** Días por frasco según la etiqueta (null si no se conoce). */
  diasPorFrasco: number | null;
  /** Ruta de su landing. */
  ruta: string;
  mensajeConsulta: string;
}

export const CATALOGO: Record<IdProducto, ProductoVenta> = {
  "testo-gh": {
    id: "testo-gh",
    ficha: PRODUCTO,
    paquetes: PAQUETES,
    paqueteInicial: PAQUETE_INICIAL,
    envio: TIENDA.envio,
    inventario: INVENTARIO,
    diasPorFrasco: DIAS_POR_FRASCO,
    ruta: "/",
    mensajeConsulta: "Hola REVIVE GROW, tengo una consulta sobre TESTO-GH.",
  },
  flo: {
    id: "flo",
    ficha: FICHA_FLO,
    paquetes: [
      { id: "dos", frascos: 2, nombre: "2 frascos", capsulas: 180, precioCentavos: 3500, destacado: true, cinta: "BLACK FRIDAY — LLEVA 2" },
      { id: "uno", frascos: 1, nombre: "1 frasco", capsulas: 90, precioCentavos: 2660, destacado: false, cinta: null },
    ],
    paqueteInicial: "dos",
    // Envío totalmente gratis para FLO (el resto de condiciones de envío son las de la tienda).
    envio: { ...TIENDA.envio, costoCentavos: 0, porProvincia: {} },
    inventario: INVENTARIO_FLO,
    diasPorFrasco: FICHA_FLO.porcion ? FICHA_FLO.capsulasPorFrasco / FICHA_FLO.porcion.capsulas : null,
    ruta: "/flo-ovarian-support/",
    mensajeConsulta: "Hola REVIVE GROW, tengo una consulta sobre FLO Ovarian Support.",
  },
};

export const PRODUCTO_PREDETERMINADO = CATALOGO["testo-gh"];

export function productoPorId(id: unknown): ProductoVenta | undefined {
  return typeof id === "string" && id in CATALOGO ? CATALOGO[id as IdProducto] : undefined;
}
