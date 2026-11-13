import { test } from "node:test";
import assert from "node:assert/strict";
import { PAQUETES, TIENDA } from "../../src/config/tienda.ts";
import {
  ahorroPaquete, costoEnvio, costoPorDiaCentavos, diasDeConsumo, disponibilidad, fechaEcuador, formatoPorcentaje,
  formatoUSD, mensajePedido, normalizarCelular, numeroPedido, paqueteDisponible, paquetePorId, totalPedido, validarPedido,
} from "../../src/lib/pedido.ts";
import { PROVINCIAS } from "../../src/lib/provincias.ts";

const dos = paquetePorId("dos")!;
const uno = paquetePorId("uno")!;

test("precios definidos por la tienda", () => {
  assert.equal(formatoUSD(uno.precioCentavos), "$27,40");
  assert.equal(formatoUSD(dos.precioCentavos), "$37,40");
  assert.equal(formatoUSD(123456), "$1.234,56");
  assert.equal(formatoUSD(0), "$0,00");
});

test("ahorro real del paquete doble frente a 2 frascos individuales", () => {
  const a = ahorroPaquete(dos);
  assert.equal(a.porSeparadoCentavos, 5480); // 2 × 27,40
  assert.equal(a.ahorroCentavos, 1740); // 54,80 − 37,40
  assert.equal(a.precioPorFrascoCentavos, 1870); // 37,40 / 2
  assert.equal(formatoPorcentaje(a.porcentaje), "31,8 %");
  assert.equal(ahorroPaquete(uno).ahorroCentavos, 0);
});

test("duración según la dosis de la etiqueta (3 cápsulas/día)", () => {
  assert.equal(diasDeConsumo(uno), 10);
  assert.equal(diasDeConsumo(dos), 20);
  assert.equal(costoPorDiaCentavos(dos), 187);
  assert.equal(costoPorDiaCentavos(uno), 274);
});

test("paquete doble preseleccionado y destacado", () => {
  assert.equal(PAQUETES.find((p) => p.destacado)?.id, "dos");
});

test("envío: por confirmar, fijo, por provincia y sin cobertura", () => {
  const base = { costoCentavos: null, porProvincia: {}, sinCobertura: [] as string[], plazo: null, courier: null };
  assert.deepEqual(costoEnvio("Pichincha", base), { estado: "por-confirmar" });
  assert.deepEqual(totalPedido(dos, "Pichincha", base).totalCentavos, null);
  const fijo = { ...base, costoCentavos: 350, porProvincia: { Galápagos: 1500 }, sinCobertura: ["Orellana"] };
  assert.equal(totalPedido(dos, "Guayas", fijo).totalCentavos, 4090);
  assert.equal(totalPedido(uno, "Galápagos", fijo).totalCentavos, 4240);
  assert.deepEqual(costoEnvio("Orellana", fijo), { estado: "sin-cobertura" });
  assert.equal(totalPedido(dos, "Azuay", { ...base, costoCentavos: 0 }).totalCentavos, 3740);
});

test("celulares de Ecuador", () => {
  for (const v of ["0991234567", "099 123 4567", "+593 99 123 4567", "593991234567", "991234567", "00593991234567"])
    assert.equal(normalizarCelular(v), "0991234567", v);
  for (const v of ["", "022345678", "09912345", "1234567890", "+57 300 123 4567"]) assert.equal(normalizarCelular(v), null, v);
});

test("24 provincias", () => assert.equal(PROVINCIAS.length, 24));

const valido = {
  nombre: "Juan Pérez", celular: "0991234567", provincia: "Pichincha", ciudad: "Quito",
  direccion: "Av. Amazonas N24-03 y Colón", referencia: "Edificio azul, junto a la farmacia", paquete: "dos", acepta: true,
};

test("validación del formulario", () => {
  assert.equal(validarPedido(valido).ok, true);
  const r = validarPedido({ ...valido, nombre: "Juan", celular: "123", provincia: "Lima", ciudad: "", direccion: "x", referencia: "", paquete: "tres", acepta: false });
  assert.deepEqual(Object.keys(r.errores).sort(), ["acepta", "celular", "ciudad", "direccion", "nombre", "paquete", "provincia", "referencia"]);
  // Limpieza de caracteres de control y espacios
  assert.equal(validarPedido({ ...valido, nombre: "  Juan\n\u0000  Pérez " }).datos.nombre, "Juan Pérez");
});

test("disponibilidad: sin dato no limita; dato vigente sí; dato viejo se ignora", () => {
  const ahora = Date.parse("2026-11-13T15:00:00Z");
  assert.equal(disponibilidad({ frascos: null, actualizadoEl: null, diasValidez: 3 }, ahora).mostrarCifra, false);
  const d1 = disponibilidad({ frascos: 1, actualizadoEl: "2026-11-13T10:00:00-05:00", diasValidez: 3 }, ahora);
  assert.equal(d1.mostrarCifra, true);
  assert.equal(paqueteDisponible(dos, d1), false);
  assert.equal(paqueteDisponible(uno, d1), true);
  assert.equal(validarPedido(valido, { disponibilidad: d1 }).errores.paquete, "Solo quedan 1 frasco(s): elige otro paquete.");
  const d0 = disponibilidad({ frascos: 0, actualizadoEl: "2026-11-12T10:00:00-05:00", diasValidez: 3 }, ahora);
  assert.equal(d0.agotado, true);
  const viejo = disponibilidad({ frascos: 0, actualizadoEl: "2026-11-01T10:00:00-05:00", diasValidez: 3 }, ahora);
  assert.equal(viejo.mostrarCifra, false);
  assert.equal(viejo.agotado, false);
});

test("fecha y número de pedido en hora de Ecuador", () => {
  const f = new Date("2026-11-14T03:30:00Z"); // 13/11 22:30 en Ecuador
  assert.equal(fechaEcuador(f), "13/11/2026 22:30");
  const n = numeroPedido(f, (k) => new Uint8Array(k).fill(0));
  assert.equal(n, "RG-261113-AAAAA");
  assert.match(numeroPedido(f, (k) => crypto.getRandomValues(new Uint8Array(k))), /^RG-261113-[A-Z2-9]{5}$/);
});

test("mensaje de WhatsApp con todos los datos del pedido", () => {
  const v = validarPedido(valido);
  const m = mensajePedido({ numero: "RG-261113-ABCDE", fecha: new Date("2026-11-13T19:05:00Z"), datos: v.datos, paquete: v.paquete!, prueba: true });
  for (const parte of [
    "PEDIDO DE PRUEBA", "Pedido: RG-261113-ABCDE", "Fecha: 13/11/2026 14:05", "Nombre: Juan Pérez", "Celular: 099 123 4567",
    "Provincia: Pichincha", "Ciudad/cantón: Quito", "Dirección: Av. Amazonas N24-03 y Colón", "Referencia: Edificio azul",
    "Cantidad: 2 frascos (60 cápsulas)", "Precio del paquete: $37,40", "Envío: por confirmar", "Total: $37,40 + envío por confirmar",
    "Pago: contra entrega",
  ]) assert.ok(m.includes(parte), parte);
});

test("la tienda sigue en vista previa", () => assert.equal(TIENDA.estado, "vista-previa"));
