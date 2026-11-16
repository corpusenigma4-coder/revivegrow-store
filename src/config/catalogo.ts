/**
 * CATÁLOGO: productos que se venden en la tienda, cada uno con su landing.
 * Precios en centavos. El servidor recalcula siempre el precio desde aquí.
 */
import { PAQUETES, PAQUETE_INICIAL, TIENDA, type ConfigEnvio } from "./tienda.ts";
import { PRODUCTO, DIAS_POR_FRASCO } from "./producto.ts";
import { FICHA_CINTURON } from "./producto-cinturon.ts";
import { INVENTARIO, INVENTARIO_CINTURON } from "./inventario.ts";
import type { Inventario } from "../lib/pedido.ts";

export interface Paquete {
  id: string;
  /** Unidades del paquete (frascos o cinturones). */
  frascos: number;
  nombre: string;
  /** Detalle que acompaña al nombre: "120 cápsulas", "modelo JY-2678"… */
  detalle: string;
  capsulas?: number;
  precioCentavos: number;
  destacado: boolean;
  cinta: string | null;
}

export type IdProducto = "testo-gh" | "cinturon";

/** Datos mínimos de un producto que usan el pie de página, el formulario y los pedidos. */
export interface FichaBase {
  nombre: string;
  nombreCompleto: string;
  marca: string;
  fabricante: string | null;
}

export interface ProductoVenta {
  id: IdProducto;
  ficha: FichaBase;
  /** Línea de producto en el pedido y en el aviso de WhatsApp. */
  lineaProducto: string;
  /** Palabra para una unidad: "frasco", "cinturón". */
  unidad: string;
  unidadPlural: string;
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
    lineaProducto: `${PRODUCTO.nombreCompleto} (${PRODUCTO.capsulasPorFrasco} cápsulas por frasco)`,
    unidad: "frasco",
    unidadPlural: "frascos",
    paquetes: PAQUETES,
    paqueteInicial: PAQUETE_INICIAL,
    envio: TIENDA.envio,
    inventario: INVENTARIO,
    diasPorFrasco: DIAS_POR_FRASCO,
    ruta: "/",
    mensajeConsulta: "Hola REVIVE GROW, tengo una consulta sobre TESTO-GH.",
  },
  cinturon: {
    id: "cinturon",
    ficha: FICHA_CINTURON,
    lineaProducto: `${FICHA_CINTURON.nombre} REVIVEGROW, modelo ${FICHA_CINTURON.modelo}`,
    unidad: "cinturón",
    unidadPlural: "cinturones",
    paquetes: [
      { id: "dos", frascos: 2, nombre: "2 cinturones", detalle: "modelo JY-2678", precioCentavos: 3500, destacado: true, cinta: "BLACK FRIDAY — LLEVA 2" },
      { id: "uno", frascos: 1, nombre: "1 cinturón", detalle: "modelo JY-2678", precioCentavos: 2660, destacado: false, cinta: null },
    ],
    paqueteInicial: "dos",
    // Envío totalmente gratis (el resto de condiciones de envío son las de la tienda).
    envio: { ...TIENDA.envio, costoCentavos: 0, porProvincia: {} },
    inventario: INVENTARIO_CINTURON,
    diasPorFrasco: null,
    ruta: "/cinturon-termico/",
    mensajeConsulta: "Hola REVIVE GROW, tengo una consulta sobre el cinturón térmico con masaje JY-2678.",
  },
};

export const PRODUCTO_PREDETERMINADO = CATALOGO["testo-gh"];

export function productoPorId(id: unknown): ProductoVenta | undefined {
  return typeof id === "string" && id in CATALOGO ? CATALOGO[id as IdProducto] : undefined;
}
