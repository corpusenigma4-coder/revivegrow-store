/**
 * FICHA DEL PRODUCTO — TESTO-GH
 * ------------------------------------------------------------
 * Fuente: foto frontal del frasco (assets-sources/testo-gh/07-frasco-frontal.webp).
 * Los materiales recibidos NO incluyen la etiqueta posterior: composición, cantidades,
 * dosis, fabricante y advertencias están en `null` y NO se inventan.
 * Cuando el proveedor envíe fotos reales de la etiqueta posterior, completa estos campos:
 * las secciones correspondientes de la página aparecen solas.
 */
export interface Activo { nombre: string; cantidad: string; vdr?: string | null; detalle?: string }

export interface FichaProducto {
  nombre: string;
  nombreCompleto: string;
  /** Lo que el envase dice que es el producto. */
  tipo: string;
  /** Marca que figura en el envase. */
  marca: string;
  capsulasPorFrasco: number;
  /** Proveedor comercial de REVIVE GROW (uso interno, no se muestra al público). */
  proveedor: string;
  /** Fabricante o titular según la etiqueta posterior / Notificación Sanitaria. */
  fabricante: string | null;
  /** Ej.: { capsulas: 2, porcionesPorEnvase: 30 } → 30 días por frasco. */
  porcion: { capsulas: number; porcionesPorEnvase: number } | null;
  /** Texto literal de la etiqueta, ej.: "Tomar 2 cápsulas al día con alimentos." */
  modoDeUso: string | null;
  /** A quién va dirigido según la etiqueta, ej.: "Hombres adultos." */
  publico: string | null;
  almacenamiento: string | null;
  /** Lista de ingredientes literal de la etiqueta. */
  ingredientes: string | null;
  /** Cantidades por porción de la información nutricional. */
  activos: Activo[];
  /** Advertencias literales de la etiqueta. */
  advertencias: string[];
}

export const PRODUCTO: FichaProducto = {
  nombre: "TESTO-GH",
  nombreCompleto: "TESTO-GH Multi Vitamin For Men",
  tipo: "Multivitamínico para hombres",
  marca: "GENETICS Nutrition & Business",
  capsulasPorFrasco: 60,
  proveedor: "NOVA SHOP",
  fabricante: null,
  porcion: null,
  modoDeUso: null,
  publico: null,
  almacenamiento: null,
  ingredientes: null,
  activos: [],
  advertencias: [],
};

/** Días que rinde un frasco según la dosis de la etiqueta; null mientras no se conozca la dosis. */
export const DIAS_POR_FRASCO: number | null = PRODUCTO.porcion
  ? Math.floor(PRODUCTO.capsulasPorFrasco / PRODUCTO.porcion.capsulas)
  : null;

/**
 * Verificaciones del producto antes del lanzamiento (marcar true solo con evidencia).
 * La foto recibida del frasco contiene textos sin sentido ("PITASETINE NERIM GRTON", "INCENDIALE",
 * "Contimae", sello "GEENTICS"), típicos de una imagen generada por IA: pedir fotos reales del frasco físico.
 */
export const VERIFICACION_PRODUCTO = {
  /** Fotos reales del frasco físico (frente, laterales y etiqueta posterior) recibidas del proveedor. */
  fotosRealesRecibidas: false,
  /** La etiqueta aprobada en la Notificación Sanitaria coincide con el frasco que se vende, incluidas las
   *  leyendas impresas ("Increase Testosterone", "Increase Muscle Mass", "Support Libido"). */
  etiquetaCoincideConNotificacion: false,
  /** Composición revisada: sin hormonas ni sustancias prohibidas (el nombre "GH" puede sugerir hormona de crecimiento). */
  composicionRevisada: false,
};
