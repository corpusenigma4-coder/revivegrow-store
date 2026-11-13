/**
 * UNIDADES DISPONIBLES (dato real del proveedor)
 * ------------------------------------------------
 * Edita estos dos valores cuando el proveedor te confirme el stock.
 * La página NO resta unidades sola ni inventa cifras:
 *  - `frascos: null`  → solo se muestra "Unidades limitadas · Oferta sujeta a disponibilidad".
 *  - `frascos: 25`    → se muestra "25 frascos disponibles · actualizado el …".
 *  - `frascos: 0`     → la página muestra "Agotado" y desactiva los pedidos.
 *  - `frascos: 1`     → el paquete de 2 frascos se desactiva (con aviso visible).
 *
 * Si la cifra tiene más de `diasValidez` días, se oculta automáticamente
 * (para no mostrar un dato viejo) y queda el mensaje genérico.
 */
export const INVENTARIO = {
  frascos: null as number | null,
  /** Fecha y hora de la última verificación con el proveedor, ej.: "2026-11-13T10:00:00-05:00". */
  actualizadoEl: null as string | null,
  diasValidez: 3,
};
