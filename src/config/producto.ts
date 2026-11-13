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
  /**
   * Duración indicada por el PROVEEDOR (no por la etiqueta). Se muestra como aproximada y
   * marcada "según el proveedor" hasta que la etiqueta la confirme (`porcion`).
   */
  duracionProveedor: { diasPorFrasco: number; texto: string } | null;
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
  // Especificación de NOVA SHOP: "Envase de 60 cápsulas (tratamiento para un mes completo)".
  duracionProveedor: { diasPorFrasco: 30, texto: "aprox. 1 mes" },
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

/** Duración aproximada que se puede mostrar: la de la etiqueta si existe; si no, la del proveedor (marcada). */
export const DURACION = DIAS_POR_FRASCO
  ? { diasPorFrasco: DIAS_POR_FRASCO, fuente: "etiqueta" as const }
  : PRODUCTO.duracionProveedor
    ? { diasPorFrasco: PRODUCTO.duracionProveedor.diasPorFrasco, fuente: "proveedor" as const }
    : null;

/** "aprox. 1 mes" / "aprox. 2 meses" para N frascos (solo duraciones de 30 días por frasco). */
export function textoDuracion(frascos: number): string | null {
  if (!DURACION) return null;
  const dias = DURACION.diasPorFrasco * frascos;
  if (DURACION.fuente === "etiqueta") return `${dias} días`;
  return dias % 30 === 0 ? `aprox. ${dias / 30} ${dias === 30 ? "mes" : "meses"}` : `aprox. ${dias} días`;
}

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
