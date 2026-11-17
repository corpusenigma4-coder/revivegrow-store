/**
 * CINTURÓN TÉRMICO CON MASAJE — modelo JY-2678, vendido bajo la marca REVIVEGROW.
 * Fuentes: ficha técnica del proveedor (AmanGO) e imágenes en assets-sources/cinturon/.
 * Regla: solo datos que figuran en esos materiales. Nada de temperaturas, número de niveles,
 * modos, autonomía, batería incorporada, uso inalámbrico ni lavado a máquina.
 */
export const FICHA_CINTURON = {
  nombre: "Cinturón térmico con masaje",
  nombreCompleto: "Cinturón térmico con masaje REVIVEGROW — modelo JY-2678",
  marca: "REVIVEGROW",
  fabricante: null as string | null,
  modelo: "JY-2678",
};

/** Ficha técnica visible en la página. */
export const ESPECIFICACIONES_CINTURON: [string, string][] = [
  ["Modelo", "JY-2678"],
  ["Tipo", "Cinturón térmico con función de masaje (vibración)"],
  ["Zona de colocación", "Abdomen"],
  ["Formato", "Banda envolvente ajustable, con cierre de velcro"],
  ["Material", "Tejido suave tipo felpa"],
  ["Controles", "Botón integrado para encender y seleccionar las funciones"],
  ["Calor", "Elementos de calefacción integrados, con niveles ajustables"],
  ["Alimentación", "USB de 5 V (la conexión va en un bolsillo interior)"],
  ["Largo", "100 cm, ajustable"],
  ["Alto", "20 cm"],
];

/**
 * Datos por confirmar con el proveedor. No se publican mientras sean null.
 * - La infografía del proveedor indica 105 cm de largo; la ficha técnica, 100 cm (se publica la ficha).
 * - La ficha muestra 20 × 5 × 15 cm y 0,4 kg sin aclarar si es el paquete: no se publica como medida de uso.
 */
export const VERIFICACION_CINTURON = {
  /** Accesorios incluidos en la caja (p. ej. cable USB). */
  accesoriosIncluidos: null as string | null,
  /** Número de niveles de calor y de modos de masaje, y cómo se cambia entre funciones (manual). */
  nivelesYModos: null as string | null,
  /** Instrucciones de limpieza y cuidado del manual. */
  cuidados: null as string | null,
  /** Largo definitivo (ficha: 100 cm; infografía: 105 cm). */
  largoConfirmado: false,
  /** Medidas y peso del paquete (ficha: 20 × 5 × 15 cm y 0,4 kg, sin aclarar). */
  medidasPaquete: null as string | null,
};

/**
 * Promoción Black Friday. Si se indica `terminaEl` (fecha REAL de fin, ej. "2026-11-30T23:59:00-05:00"),
 * la página muestra "hasta el 30/11/2026". Sin fecha no se muestra ninguna (nunca una fecha inventada).
 */
export const PROMO_CINTURON = {
  nombre: "Black Friday",
  terminaEl: null as string | null,
};
