/** Prueba la función de pedidos con una base SQLite real (node:sqlite) que imita D1. */
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { recibirPedido, estadoServicio, cuerpoPlantilla, _reiniciarEsquema, type D1Like, type Entorno } from "../../src/server/pedidos.ts";

function d1Falso(): D1Like & { sql: DatabaseSync } {
  const sql = new DatabaseSync(":memory:");
  return {
    sql,
    prepare(q: string) {
      return {
        bind(...v: unknown[]) {
          const args = v as (string | number | null)[];
          return {
            async first<T>() { return ((sql.prepare(q).get(...args) as T) ?? null); },
            async run() { return sql.prepare(q).run(...args); },
          };
        },
      };
    },
  };
}

const AHORA = new Date("2026-11-13T19:00:00Z");
let db: ReturnType<typeof d1Falso>;
let n = 0;
beforeEach(() => { _reiniciarEsquema(); db = d1Falso(); });

function peticion(cuerpo: Record<string, unknown>, extra: Record<string, string> = {}) {
  return new Request("https://revivegrow.ec/api/pedido", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "https://revivegrow.ec", "cf-connecting-ip": "190.1.2.3", ...extra },
    body: JSON.stringify(cuerpo),
  });
}

const base = () => ({
  nombre: "María Torres", celular: "0987654321", provincia: "Guayas", ciudad: "Guayaquil",
  direccion: "Cdla. Kennedy Norte, Av. Francisco de Orellana 123", referencia: "Frente al parque", paquete: "dos",
  acepta: true, clave: `clave-de-prueba-${++n}-xxxxxxxx`, transcurridoMs: 25000, empresa_web: "",
});

test("sin base de datos: 503 SIN_BACKEND (la web usa WhatsApp prellenado)", async () => {
  const r = await recibirPedido(peticion(base()), {});
  assert.equal(r.status, 503);
  assert.equal((await r.json()).codigo, "SIN_BACKEND");
  assert.deepEqual(await estadoServicio({}).json(), { activo: false, notificacionWhatsApp: false, turnstileSiteKey: null });
});

test("guarda el pedido con precio calculado en el servidor", async () => {
  const r = await recibirPedido(peticion({ ...base(), precioCentavos: 1 }), { DB: db }, { ahora: () => AHORA });
  const j = await r.json();
  assert.equal(r.status, 200);
  assert.equal(j.ok, true);
  assert.match(j.numero, /^RG-261113-[A-Z2-9]{5}$/);
  assert.equal(j.notificado, false);
  const fila = db.sql.prepare("SELECT * FROM pedidos").get() as Record<string, unknown>;
  assert.equal(fila.precio_centavos, 3740);
  assert.equal(fila.frascos, 2);
  assert.equal(fila.total_centavos, null); // envío por confirmar
  assert.equal(fila.prueba, 1);
  assert.equal(fila.celular, "0987654321");
  assert.ok(!String(fila.ip_hash).includes("190.1.2.3"));
});

test("duplicados: misma clave y mismo celular+paquete devuelven el mismo pedido", async () => {
  const b = base();
  const a = await (await recibirPedido(peticion(b), { DB: db }, { ahora: () => AHORA })).json();
  const otraVez = await (await recibirPedido(peticion(b), { DB: db }, { ahora: () => AHORA })).json();
  assert.equal(otraVez.numero, a.numero);
  assert.equal(otraVez.duplicado, true);
  const mismoCel = await (await recibirPedido(peticion({ ...base(), celular: b.celular }), { DB: db }, { ahora: () => AHORA })).json();
  assert.equal(mismoCel.numero, a.numero);
  assert.equal((db.sql.prepare("SELECT COUNT(*) AS n FROM pedidos").get() as { n: number }).n, 1);
});

test("anti-spam: trampa, demasiado rápido, origen externo y límite por IP", async () => {
  assert.equal((await recibirPedido(peticion({ ...base(), empresa_web: "http://spam" }), { DB: db })).status, 400);
  assert.equal((await recibirPedido(peticion({ ...base(), transcurridoMs: 500 }), { DB: db })).status, 400);
  assert.equal((await recibirPedido(peticion(base(), { origin: "https://otro.com" }), { DB: db })).status, 403);
  for (let i = 0; i < 5; i++) {
    const r = await recibirPedido(peticion({ ...base(), celular: `09900000${10 + i}` }), { DB: db }, { ahora: () => AHORA });
    assert.equal(r.status, 200);
  }
  const r = await recibirPedido(peticion({ ...base(), celular: "0990000099" }), { DB: db }, { ahora: () => AHORA });
  assert.equal(r.status, 429);
});

test("datos inválidos: 422 con errores por campo y nada guardado", async () => {
  const r = await recibirPedido(peticion({ ...base(), celular: "12", acepta: false }), { DB: db });
  const j = await r.json();
  assert.equal(r.status, 422);
  assert.ok(j.errores.celular && j.errores.acepta);
});

test("notificación por WhatsApp Cloud API con plantilla", async () => {
  const llamadas: { url: string; body: any; auth: string }[] = [];
  const fetchFalso = (async (url: string, init: RequestInit) => {
    llamadas.push({ url, body: JSON.parse(String(init.body)), auth: String((init.headers as Record<string, string>).authorization) });
    return new Response(JSON.stringify({ messages: [{ id: "wamid.x" }] }), { status: 200 });
  }) as unknown as typeof fetch;
  const env: Entorno = { DB: db, WHATSAPP_TOKEN: "tok", WHATSAPP_PHONE_NUMBER_ID: "123", WHATSAPP_NOTIFY_TO: "593960702682" };
  const j = await (await recibirPedido(peticion(base()), env, { ahora: () => AHORA, fetch: fetchFalso })).json();
  assert.equal(j.notificado, true);
  assert.equal(llamadas.length, 1);
  assert.equal(llamadas[0].url, "https://graph.facebook.com/v21.0/123/messages");
  assert.equal(llamadas[0].auth, "Bearer tok");
  const params = llamadas[0].body.template.components[0].parameters.map((p: { text: string }) => p.text);
  assert.equal(params.length, 10);
  assert.ok(params[0].endsWith("(PRUEBA)"));
  assert.equal(params[2], "María Torres");
  assert.equal(params[9], "$37,40 + envío por confirmar");
  for (const p of params) assert.ok(!/[\n\t]| {5,}/.test(p));
});

test("si WhatsApp falla, el pedido queda guardado y se informa notificado=false", async () => {
  const fetchFalla = (async () => new Response("{\"error\":{}}", { status: 401 })) as unknown as typeof fetch;
  const env: Entorno = { DB: db, WHATSAPP_TOKEN: "x", WHATSAPP_PHONE_NUMBER_ID: "1" };
  const j = await (await recibirPedido(peticion(base()), env, { ahora: () => AHORA, fetch: fetchFalla })).json();
  assert.equal(j.ok, true);
  assert.equal(j.notificado, false);
  const fila = db.sql.prepare("SELECT error_notificacion FROM pedidos").get() as { error_notificacion: string };
  assert.match(fila.error_notificacion, /HTTP 401/);
});

test("Turnstile: rechaza si la verificación falla", async () => {
  const fetchNo = (async () => new Response(JSON.stringify({ success: false }))) as unknown as typeof fetch;
  const r = await recibirPedido(peticion({ ...base(), turnstile: "abc" }), { DB: db, TURNSTILE_SECRET_KEY: "s" }, { fetch: fetchNo });
  assert.equal(r.status, 400);
  assert.equal((await r.json()).codigo, "VERIFICACION");
});

test("destinatario por defecto: WhatsApp de la tienda", () => {
  const c = cuerpoPlantilla({}, { numero: "RG-1", fecha: "", prueba: false, nombre: "a", celular: "0991234567", destino: "", direccion: "", referencia: "", producto: "", envio: "", total: "" });
  assert.equal(c.to, "593960702682");
  assert.equal(c.template.name, "nuevo_pedido");
});
