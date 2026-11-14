/**
 * FICHA DEL PRODUCTO — FLO Ovarian Support (O Positiv Health)
 * Fuente: "Información del Suplemento" (assets-sources/flo/04-informacion-suplemento.png) y foto del envase.
 * No añadir datos que no estén en la etiqueta.
 */
import type { FichaProducto } from "./producto.ts";

export const FICHA_FLO: FichaProducto = {
  nombre: "FLO Ovarian Support",
  nombreCompleto: "FLO Ovarian Support — O Positiv Health",
  tipo: "Suplemento alimenticio en cápsulas veganas",
  marca: "O Positiv Health",
  capsulasPorFrasco: 90,
  proveedor: "por confirmar",
  fabricante: null,
  duracionProveedor: null,
  porcion: { capsulas: 3, porcionesPorEnvase: 30 },
  modoDeUso: "Adultos: tomar 3 cápsulas una vez al día con agua, o según las indicaciones de un profesional de la salud.",
  publico: null,
  almacenamiento: "Conservar en un lugar fresco y seco.",
  ingredientes: "Otros ingredientes: celulosa (cápsula vegetal), estearato de magnesio, colorantes naturales.",
  activos: [
    { nombre: "Mio-Inositol", cantidad: "2000 mg", vdr: null },
    { nombre: "Diindolilmetano (DIM)", cantidad: "100 mg", vdr: null },
    { nombre: "D-Quiro-Inositol", cantidad: "50 mg", vdr: null, detalle: "del extracto de vainas de algarrobo (Ceratonia siliqua)" },
    { nombre: "Folato (como ácido fólico)", cantidad: "680 mcg DFE", vdr: "170 %" },
  ],
  advertencias: [],
};

/** Verificaciones antes del lanzamiento (marcar true solo con evidencia). */
export const VERIFICACION_FLO = {
  /** Importador y Notificación Sanitaria ARCSA del producto (es un suplemento importado de EE. UU.). */
  notificacionSanitaria: null as string | null,
  /** Caducidad del lote en venta (AAAA-MM). */
  caducidadLote: null as string | null,
  /** Fuente documentada de las 4 reseñas (enlace o captura de la plataforma original y fecha). */
  fuenteResenas: null as string | null,
  /** Revisión de los textos (incluidas las reseñas, que mencionan efectos en la salud) frente a la normativa ARCSA. */
  publicidadRevisada: false,
};

/**
 * Promoción Black Friday. Si se indica `terminaEl` (fecha REAL de fin, ej. "2026-11-30T23:59:00-05:00"),
 * la página muestra "hasta el 30/11/2026". Sin fecha, solo "sujeto a disponibilidad" (nunca una fecha inventada).
 */
export const PROMO_FLO = {
  nombre: "Black Friday",
  terminaEl: null as string | null,
};
