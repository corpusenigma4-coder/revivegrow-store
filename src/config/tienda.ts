/**
 * ============================================================
 *  REVIVE GROW ECUADOR — CONFIGURACIÓN EDITABLE DE LA TIENDA
 * ============================================================
 * Este es el archivo que debes editar para cambiar precios, envío,
 * datos de la empresa o activar la tienda. Las unidades disponibles
 * están en `inventario.ts`.
 *
 * Regla de oro: si un dato no está confirmado, déjalo en `null`.
 * La página nunca inventa un dato: muestra un texto neutro y
 * `npm run check:launch` lo lista como pendiente.
 */

export interface ConfigEnvio {
  costoCentavos: number | null;
  porProvincia: Record<string, number>;
  sinCobertura: readonly string[];
  plazo: string | null;
  courier: string | null;
}

/** Precios en CENTAVOS de dólar (2740 = $27,40) para evitar errores de redondeo. */
export const PAQUETES = [
  {
    id: "dos",
    frascos: 2,
    nombre: "2 frascos",
    capsulas: 120,
    precioCentavos: 3740,
    destacado: true,
    cinta: "OFERTA ESPECIAL — LLEVA 2",
  },
  {
    id: "uno",
    frascos: 1,
    nombre: "1 frasco",
    capsulas: 60,
    precioCentavos: 2740,
    destacado: false,
    cinta: null,
  },
] as const;

/** Paquete marcado al cargar la página. El comprador puede cambiarlo; nunca se cambia solo. */
export const PAQUETE_INICIAL: (typeof PAQUETES)[number]["id"] = "dos";

export const TIENDA = {
  marca: "REVIVE GROW",
  dominio: "revivegrow.ec",
  url: "https://revivegrow.ec",

  /**
   * "vista-previa": noindex, aviso visible y pedidos marcados como PRUEBA.
   * "operativa": solo se puede compilar si `npm run check:launch` no encuentra pendientes.
   */
  estado: "vista-previa" as "vista-previa" | "operativa",

  whatsapp: {
    /** Número en formato internacional sin "+" (Ecuador 593 + número sin el 0 inicial). */
    internacional: "593960702682",
    visible: "096 070 2682",
  },

  /** Datos administrativos del vendedor. NO inventar: completar con documentos reales. */
  empresa: {
    razonSocial: null as string | null, // Nombre o razón social que consta en el RUC
    ruc: null as string | null,
    domicilio: null as string | null, // Ciudad y dirección para notificaciones
    correo: null as string | null, // Opcional, para solicitudes de privacidad
    horarioAtencion: null as string | null, // Ej.: "Lunes a sábado, 9:00 a 18:00"
  },

  /** Requisitos sanitarios (ARCSA). Obligatorio antes de pasar a "operativa". */
  sanitario: {
    /** Número de Notificación Sanitaria del producto, verificado en ARCSA. */
    notificacionSanitaria: null as string | null,
    /** Fecha en que se verificó el número en ARCSA (AAAA-MM-DD). */
    verificadoEl: null as string | null,
    /**
     * Caducidad del lote que se va a vender, comprobada en el frasco (AAAA-MM).
     * Pedir al proveedor una foto del lote y la fecha de caducidad del frasco que se va a vender.
     */
    caducidadLoteEnVenta: null as string | null,
    /** ¿El texto publicitario fue revisado contra la normativa ARCSA vigente? */
    publicidadRevisada: false,
  },

  envio: {
    /**
     * Costo de envío en centavos.
     *  - null  → "por confirmar": se informa por WhatsApp ANTES del despacho.
     *  - 0     → envío gratis.
     *  - 350   → $3,50 para todo el país (salvo `porProvincia`).
     */
    costoCentavos: null as number | null,
    /** Costos distintos por provincia (centavos). Ej.: { "Galápagos": 1500 } */
    porProvincia: {} as Record<string, number>,
    /** Provincias sin cobertura de pago contra entrega. Ej.: ["Galápagos"] */
    sinCobertura: [] as string[],
    /** Plazo estimado, ej.: "24 a 72 horas hábiles según la ciudad". null = se informa por WhatsApp. */
    plazo: null as string | null,
    /** Empresa de mensajería. */
    courier: null as string | null,
  } as ConfigEnvio,

  pago: {
    /** Formas de pago aceptadas al recibir, ej.: ["efectivo"] o ["efectivo", "transferencia"]. */
    formasAlRecibir: null as string[] | null,
    /** ¿Los precios incluyen IVA? null = por confirmar con tu contador. */
    preciosIncluyenIva: null as boolean | null,
  },

  devoluciones: {
    /** Quién paga el envío de una devolución por arrepentimiento. */
    costoEnvioDevolucion: null as string | null,
    /** Cómo se reembolsa (ej.: "transferencia bancaria en 5 días hábiles"). */
    formaReembolso: null as string | null,
  },

  privacidad: {
    /** Tiempo de conservación de los datos de pedidos, ej.: "2 años desde la entrega". */
    plazoConservacion: null as string | null,
    /** ¿El proveedor (NOVA SHOP) recibe los datos del cliente para despachar? */
    proveedorRecibeDatos: null as boolean | null,
  },

  /** Píxel de Meta: queda inactivo mientras sea null. */
  metaPixelId: null as string | null,

  /**
   * Dirección del servidor de pedidos cuando la web está en GitHub Pages (que no ejecuta servidor),
   * ej.: "https://revivegrow-pedidos.<tu-cuenta>.workers.dev/api/pedido" (carpeta worker/).
   * null → se usa /api/pedido del mismo sitio (Cloudflare Pages) y, si no existe, WhatsApp prellenado.
   */
  apiPedidos: null as string | null,
} as const;

/** Enlace de WhatsApp con mensaje opcional. */
export function enlaceWhatsApp(texto?: string): string {
  const base = `https://wa.me/${TIENDA.whatsapp.internacional}`;
  return texto ? `${base}?text=${encodeURIComponent(texto)}` : base;
}

export const MENSAJE_CONSULTA = "Hola REVIVE GROW, tengo una consulta sobre TESTO-GH.";
