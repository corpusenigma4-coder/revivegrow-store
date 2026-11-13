/**
 * Recepción de pedidos (modalidad B) — se ejecuta en Cloudflare Pages Functions.
 *
 *  GET  /api/pedido → estado del servicio (sin datos personales).
 *  POST /api/pedido → valida, guarda en D1 (anti-spam y anti-duplicados) y
 *                     notifica al WhatsApp del negocio con la API oficial de WhatsApp Cloud.
 *
 * Todo se configura en el panel de Cloudflare (ver docs/CONFIGURACION.md); nada secreto
 * vive en el repositorio. Sin base de datos configurada responde 503 SIN_BACKEND y la
 * página usa la modalidad A (WhatsApp con mensaje prellenado).
 */
import { TIENDA } from "../config/tienda.ts";
import { INVENTARIO } from "../config/inventario.ts";
import { PRODUCTO } from "../config/producto.ts";
import {
  celularInternacional,
  disponibilidad,
  fechaEcuador,
  formatoUSD,
  limpiarTexto,
  numeroPedido,
  textoTotal,
  totalPedido,
  validarPedido,
  type Campo,
} from "../lib/pedido.ts";

/* Subconjunto de la API de D1 que usamos (permite probar con SQLite local). */
export interface D1Like {
  prepare(sql: string): {
    bind(...v: unknown[]): {
      first<T = Record<string, unknown>>(): Promise<T | null>;
      run(): Promise<unknown>;
    };
  };
}

export interface Entorno {
  DB?: D1Like;
  /** Token permanente de un usuario del sistema de Meta con permiso whatsapp_business_messaging. */
  WHATSAPP_TOKEN?: string;
  /** ID del número EMISOR registrado en WhatsApp Cloud API. */
  WHATSAPP_PHONE_NUMBER_ID?: string;
  /** Número que RECIBE el aviso, formato 593XXXXXXXXX (por defecto, el WhatsApp de la tienda). */
  WHATSAPP_NOTIFY_TO?: string;
  /** Nombre de la plantilla aprobada (por defecto "nuevo_pedido") e idioma ("es"). */
  WHATSAPP_TEMPLATE?: string;
  WHATSAPP_TEMPLATE_LANG?: string;
  /** Cloudflare Turnstile (opcional, recomendado). */
  TURNSTILE_SITE_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
  /** Sal secreta para anonimizar IP en el control de abuso. */
  IP_SALT?: string;
}

export interface Opciones {
  ahora?: () => Date;
  fetch?: typeof fetch;
  aleatorio?: (n: number) => Uint8Array;
}

const LIMITE_POR_IP = 5; // pedidos por IP…
const VENTANA_IP_MIN = 30; // …cada 30 minutos
const VENTANA_DUPLICADO_MIN = 30; // mismo celular + mismo paquete = duplicado
const TIEMPO_MINIMO_MS = 4000; // un humano tarda más de 4 s en completar el formulario
const TAMANO_MAXIMO = 4096;

const ESQUEMA = [
  `CREATE TABLE IF NOT EXISTS pedidos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numero TEXT NOT NULL UNIQUE,
    clave TEXT NOT NULL UNIQUE,
    creado_en TEXT NOT NULL,
    nombre TEXT NOT NULL,
    celular TEXT NOT NULL,
    provincia TEXT NOT NULL,
    ciudad TEXT NOT NULL,
    direccion TEXT NOT NULL,
    referencia TEXT NOT NULL,
    paquete TEXT NOT NULL,
    frascos INTEGER NOT NULL,
    precio_centavos INTEGER NOT NULL,
    envio_centavos INTEGER,
    total_centavos INTEGER,
    estado TEXT NOT NULL DEFAULT 'nuevo',
    prueba INTEGER NOT NULL DEFAULT 0,
    ip_hash TEXT,
    notificado_en TEXT,
    error_notificacion TEXT
  )`,
  "CREATE INDEX IF NOT EXISTS idx_pedidos_celular ON pedidos (celular, creado_en)",
  "CREATE INDEX IF NOT EXISTS idx_pedidos_ip ON pedidos (ip_hash, creado_en)",
];

let esquemaListo: WeakSet<object> = new WeakSet();

async function asegurarEsquema(db: D1Like) {
  if (esquemaListo.has(db)) return;
  for (const sql of ESQUEMA) await db.prepare(sql).bind().run();
  esquemaListo.add(db);
}

function json(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

async function sha256(texto: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(texto));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function hace(min: number, ahora: Date): string {
  return new Date(ahora.getTime() - min * 60_000).toISOString();
}

function notificacionConfigurada(env: Entorno): boolean {
  return Boolean(env.WHATSAPP_TOKEN && env.WHATSAPP_PHONE_NUMBER_ID);
}

/* ---------------------------------------------------------------- GET */

export function estadoServicio(env: Entorno) {
  return json({
    activo: Boolean(env.DB),
    notificacionWhatsApp: notificacionConfigurada(env),
    turnstileSiteKey: env.TURNSTILE_SITE_KEY && env.TURNSTILE_SECRET_KEY ? env.TURNSTILE_SITE_KEY : null,
  });
}

/* ---------------------------------------------------------------- POST */

export async function recibirPedido(req: Request, env: Entorno, op: Opciones = {}): Promise<Response> {
  const ahora = op.ahora?.() ?? new Date();
  const fetcher = op.fetch ?? fetch;
  const aleatorio = op.aleatorio ?? ((n: number) => crypto.getRandomValues(new Uint8Array(n)));

  if (!env.DB) return json({ ok: false, codigo: "SIN_BACKEND" }, 503);

  // Solo peticiones desde la propia web (protección CSRF básica).
  const origen = req.headers.get("origin");
  if (origen && new URL(origen).host !== new URL(req.url).host) return json({ ok: false, codigo: "ORIGEN" }, 403);
  if (!(req.headers.get("content-type") ?? "").includes("application/json")) return json({ ok: false, codigo: "FORMATO" }, 415);

  const crudo = await req.text();
  if (crudo.length > TAMANO_MAXIMO) return json({ ok: false, codigo: "FORMATO" }, 413);
  let cuerpo: Record<string, unknown>;
  try {
    cuerpo = JSON.parse(crudo);
    if (!cuerpo || typeof cuerpo !== "object") throw new Error();
  } catch {
    return json({ ok: false, codigo: "FORMATO" }, 400);
  }

  // Anti-spam: campo trampa invisible y tiempo mínimo de llenado.
  if (limpiarTexto(cuerpo.empresa_web)) return json({ ok: false, codigo: "SPAM" }, 400);
  const transcurrido = Number(cuerpo.transcurridoMs);
  if (!Number.isFinite(transcurrido) || transcurrido < TIEMPO_MINIMO_MS) return json({ ok: false, codigo: "MUY_RAPIDO" }, 400);

  const clave = limpiarTexto(cuerpo.clave, 64);
  if (!/^[A-Za-z0-9-]{16,64}$/.test(clave)) return json({ ok: false, codigo: "FORMATO" }, 400);

  // Cloudflare Turnstile, si está configurado.
  if (env.TURNSTILE_SECRET_KEY) {
    const token = limpiarTexto(cuerpo.turnstile, 2048);
    const form = new FormData();
    form.append("secret", env.TURNSTILE_SECRET_KEY);
    form.append("response", token);
    const ip = req.headers.get("cf-connecting-ip");
    if (ip) form.append("remoteip", ip);
    let valido = false;
    try {
      const r = await fetcher("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form });
      valido = Boolean(((await r.json()) as { success?: boolean }).success);
    } catch {
      valido = false;
    }
    if (!valido) return json({ ok: false, codigo: "VERIFICACION" }, 400);
  }

  const v = validarPedido(cuerpo as Partial<Record<Campo, unknown>>, { disponibilidad: disponibilidad(INVENTARIO, ahora.getTime()) });
  if (!v.ok || !v.paquete) return json({ ok: false, codigo: "DATOS", errores: v.errores }, 422);
  const { datos, paquete } = v;

  const db = env.DB;
  await asegurarEsquema(db);

  // Reintento del mismo envío (doble clic, red lenta): devolver el mismo pedido.
  const previo = await db.prepare("SELECT numero, notificado_en FROM pedidos WHERE clave = ?").bind(clave).first<{ numero: string; notificado_en: string | null }>();
  if (previo) return json({ ok: true, numero: previo.numero, duplicado: true, notificado: Boolean(previo.notificado_en) });

  // Mismo celular y mismo paquete hace poco: es el mismo pedido.
  const repetido = await db
    .prepare("SELECT numero, notificado_en FROM pedidos WHERE celular = ? AND paquete = ? AND creado_en > ? ORDER BY id DESC LIMIT 1")
    .bind(datos.celular, paquete.id, hace(VENTANA_DUPLICADO_MIN, ahora))
    .first<{ numero: string; notificado_en: string | null }>();
  if (repetido) return json({ ok: true, numero: repetido.numero, duplicado: true, notificado: Boolean(repetido.notificado_en) });

  // Límite por IP (anonimizada con sal secreta; nunca se guarda la IP).
  const ip = req.headers.get("cf-connecting-ip") ?? "";
  const ipHash = ip ? (await sha256(`${env.IP_SALT ?? "revivegrow"}|${ip}`)).slice(0, 32) : null;
  if (ipHash) {
    const n = await db.prepare("SELECT COUNT(*) AS n FROM pedidos WHERE ip_hash = ? AND creado_en > ?").bind(ipHash, hace(VENTANA_IP_MIN, ahora)).first<{ n: number }>();
    if ((n?.n ?? 0) >= LIMITE_POR_IP) return json({ ok: false, codigo: "LIMITE" }, 429);
  }

  const t = totalPedido(paquete, datos.provincia);
  const prueba = TIENDA.estado !== "operativa";
  let numero = "";
  for (let intento = 0; intento < 4; intento++) {
    numero = numeroPedido(ahora, aleatorio);
    try {
      await db
        .prepare(
          `INSERT INTO pedidos (numero, clave, creado_en, nombre, celular, provincia, ciudad, direccion, referencia,
             paquete, frascos, precio_centavos, envio_centavos, total_centavos, prueba, ip_hash)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          numero, clave, ahora.toISOString(), datos.nombre, datos.celular, datos.provincia, datos.ciudad, datos.direccion,
          datos.referencia, paquete.id, paquete.frascos, paquete.precioCentavos,
          t.envio.estado === "definido" ? t.envio.centavos : null, t.totalCentavos, prueba ? 1 : 0, ipHash,
        )
        .run();
      break;
    } catch (e) {
      const msg = String((e as Error)?.message ?? e);
      if (/UNIQUE/i.test(msg) && /clave/i.test(msg)) {
        const r = await db.prepare("SELECT numero FROM pedidos WHERE clave = ?").bind(clave).first<{ numero: string }>();
        if (r) return json({ ok: true, numero: r.numero, duplicado: true, notificado: false });
      }
      if (!/UNIQUE/i.test(msg) || intento === 3) return json({ ok: false, codigo: "ERROR_GUARDADO" }, 500);
    }
  }

  // Aviso al WhatsApp del negocio (API oficial de WhatsApp Cloud).
  let notificado = false;
  if (notificacionConfigurada(env)) {
    const r = await notificarWhatsApp(env, fetcher, {
      numero, fecha: fechaEcuador(ahora), prueba,
      nombre: datos.nombre, celular: datos.celular,
      destino: `${datos.ciudad}, ${datos.provincia}`,
      direccion: datos.direccion, referencia: datos.referencia,
      producto: `${paquete.nombre} ${PRODUCTO.nombre} (${paquete.capsulas} cápsulas) · ${formatoUSD(paquete.precioCentavos)}`,
      envio: t.envio.estado === "definido" ? formatoUSD(t.envio.centavos) : "por confirmar",
      total: textoTotal(t),
    });
    notificado = r.ok;
    await db
      .prepare("UPDATE pedidos SET notificado_en = ?, error_notificacion = ? WHERE numero = ?")
      .bind(r.ok ? new Date().toISOString() : null, r.ok ? null : r.error.slice(0, 300), numero)
      .run();
  }

  return json({ ok: true, numero, duplicado: false, notificado });
}

/* ---------------------------------------------------------------- WhatsApp Cloud API */

export interface AvisoPedido {
  numero: string;
  fecha: string;
  prueba: boolean;
  nombre: string;
  celular: string;
  destino: string;
  direccion: string;
  referencia: string;
  producto: string;
  envio: string;
  total: string;
}

/** Las variables de plantilla no admiten saltos de línea, tabulaciones ni >4 espacios seguidos. */
function parametro(texto: string): { type: "text"; text: string } {
  return { type: "text", text: limpiarTexto(texto, 300) || "-" };
}

/**
 * Plantilla "nuevo_pedido" (categoría Utilidad, idioma es) con 10 variables en este orden:
 * {{1}} número · {{2}} fecha · {{3}} cliente · {{4}} celular · {{5}} ciudad y provincia ·
 * {{6}} dirección · {{7}} referencia · {{8}} producto · {{9}} envío · {{10}} total.
 */
export function cuerpoPlantilla(env: Entorno, a: AvisoPedido) {
  return {
    messaging_product: "whatsapp",
    to: env.WHATSAPP_NOTIFY_TO || TIENDA.whatsapp.internacional,
    type: "template",
    template: {
      name: env.WHATSAPP_TEMPLATE || "nuevo_pedido",
      language: { code: env.WHATSAPP_TEMPLATE_LANG || "es" },
      components: [
        {
          type: "body",
          parameters: [
            parametro(a.prueba ? `${a.numero} (PRUEBA)` : a.numero),
            parametro(a.fecha),
            parametro(a.nombre),
            parametro(`${a.celular} · wa.me/${celularInternacional(a.celular)}`),
            parametro(a.destino),
            parametro(a.direccion),
            parametro(a.referencia),
            parametro(a.producto),
            parametro(a.envio),
            parametro(a.total),
          ],
        },
      ],
    },
  };
}

async function notificarWhatsApp(env: Entorno, fetcher: typeof fetch, a: AvisoPedido): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const ctrl = new AbortController();
    const temporizador = setTimeout(() => ctrl.abort(), 8000);
    const r = await fetcher(`https://graph.facebook.com/v21.0/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: { authorization: `Bearer ${env.WHATSAPP_TOKEN}`, "content-type": "application/json" },
      body: JSON.stringify(cuerpoPlantilla(env, a)),
      signal: ctrl.signal,
    });
    clearTimeout(temporizador);
    if (r.ok) return { ok: true };
    return { ok: false, error: `HTTP ${r.status}: ${(await r.text()).slice(0, 250)}` };
  } catch (e) {
    return { ok: false, error: String((e as Error)?.message ?? e) };
  }
}

/** Solo para pruebas. */
export function _reiniciarEsquema() {
  esquemaListo = new WeakSet();
}
