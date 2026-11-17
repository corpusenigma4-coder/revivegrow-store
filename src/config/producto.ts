/**
 * FICHA DEL PRODUCTO — TESTO-GH
 * ------------------------------------------------------------
 * Fuentes: frente del frasco (assets-sources/testo-gh/07-frasco-frontal.webp) y etiqueta
 * posterior (13-etiqueta-posterior.webp): composición, porción, modo de uso y advertencias.
 * La etiqueta posterior tiene Lote y Caducidad EN BLANCO y no indica fabricante ni Notificación Sanitaria.
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

/** Píxel de Meta "TESTO PIXEL" (portafolio Revivegrow): solo se carga en la landing de TESTO-GH. */
export const PIXEL_TESTO = "1902112674105886";

export const PRODUCTO: FichaProducto = {
  nombre: "TESTO-GH",
  nombreCompleto: "TESTO-GH Multi Vitamin For Men",
  tipo: "Multivitamínico para hombres",
  marca: "GENETICS Nutrition & Business",
  capsulasPorFrasco: 60,
  proveedor: "NOVA SHOP",
  // La etiqueta posterior dice "Distribuido por GENETICS®" (www.genetics-nb.com); no indica fabricante.
  fabricante: null,
  // Especificación de NOVA SHOP: "Envase de 60 cápsulas (tratamiento para un mes completo)".
  duracionProveedor: { diasPorFrasco: 30, texto: "aprox. 1 mes" },
  // Etiqueta posterior: porción 2 cápsulas, 30 porciones por envase ("60 cápsulas · 30 días de suministro").
  porcion: { capsulas: 2, porcionesPorEnvase: 30 },
  // Literal de la etiqueta, sin la frase final sobre la hormona de crecimiento (afirmación no publicable).
  modoDeUso:
    "Tomar 2 cápsulas al día con una comida: 30 minutos antes de entrenar en días de ejercicio, o antes de dormir en días de descanso. No exceder la dosis.",
  publico: null,
  almacenamiento: null,
  ingredientes: null,
  activos: [
    { nombre: "Vitamina D3", cantidad: "20 mcg", vdr: "100 %" },
    { nombre: "Vitamina B6", cantidad: "1,4 mg", vdr: "109 %" },
    { nombre: "Vitamina B12", cantidad: "2,4 mcg", vdr: "100 %" },
    { nombre: "Zinc", cantidad: "10 mg", vdr: "100 %" },
    { nombre: "Magnesio", cantidad: "300 mg", vdr: "80 %" },
    { nombre: "Ácido D-aspártico", cantidad: "500 mg", vdr: null },
    { nombre: "Fenogreco", cantidad: "250 mg", vdr: null, detalle: "50 % saponinas" },
    { nombre: "Tribulus terrestris", cantidad: "250 mg", vdr: null },
    { nombre: "Ashwagandha KSM-66®", cantidad: "200 mg", vdr: null },
    { nombre: "Extracto de maca", cantidad: "150 mg", vdr: null },
  ],
  advertencias: [
    "Mantener fuera del alcance de los niños.",
    "No usar en menores de 15 años, embarazadas o lactantes.",
    "Los complementos no sustituyen una dieta variada y un estilo de vida saludable.",
    "Consulte a su médico.",
  ],
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
  /** Composición revisada: sin hormonas ni sustancias prohibidas (el nombre "GH" puede sugerir hormona de crecimiento).
   *  La etiqueta posterior recibida declara vitaminas, minerales, ácido D-aspártico y extractos vegetales (sin hormonas);
   *  falta confirmarlo con la Notificación Sanitaria y un frasco físico. */
  composicionRevisada: false,
};
