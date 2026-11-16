import { test } from "node:test";
import assert from "node:assert/strict";
import { CATALOGO, productoPorId } from "../../src/config/catalogo.ts";
import { ESPECIFICACIONES_CINTURON, PROMO_CINTURON } from "../../src/config/producto-cinturon.ts";
import { ahorroPaquete, formatoPorcentaje, formatoUSD, mensajePedido, paquetePorId, totalPedido, validarPedido } from "../../src/lib/pedido.ts";

const cin = CATALOGO.cinturon;
const dos = paquetePorId("dos", cin)!;
const uno = paquetePorId("uno", cin)!;

test("cinturón: precios Black Friday y ahorro real", () => {
  assert.equal(formatoUSD(uno.precioCentavos), "$26,60");
  assert.equal(formatoUSD(dos.precioCentavos), "$35,00");
  const a = ahorroPaquete(dos, cin);
  assert.equal(a.porSeparadoCentavos, 5320);
  assert.equal(a.ahorroCentavos, 1820);
  assert.equal(formatoPorcentaje(a.porcentaje), "34,2 %");
  assert.equal(a.precioPorFrascoCentavos, 1750);
  assert.equal(cin.paqueteInicial, "dos");
  assert.equal(dos.destacado, true);
  assert.equal(PROMO_CINTURON.terminaEl, null);
});

test("cinturón: envío gratis → el total es el precio del paquete", () => {
  assert.equal(totalPedido(dos, "Loja", cin.envio).totalCentavos, 3500);
  assert.equal(totalPedido(uno, "Galápagos", cin.envio).totalCentavos, 2660);
});

test("cinturón: el pedido identifica el producto, cantidad, total y pago contra entrega", () => {
  const v = validarPedido(
    { nombre: "Ana Ruiz", celular: "0981234567", provincia: "Azuay", ciudad: "Cuenca", direccion: "Calle Larga 7-45 y Borrero", referencia: "Puerta verde", paquete: "uno", acepta: true },
    { producto: cin },
  );
  assert.equal(v.ok, true);
  const m = mensajePedido({ numero: "RG-1", fecha: new Date("2026-11-20T15:00:00Z"), datos: v.datos, paquete: v.paquete!, producto: cin });
  for (const t of ["Producto: Cinturón térmico con masaje REVIVEGROW, modelo JY-2678", "Cantidad: 1 cinturón (modelo JY-2678)", "Precio del paquete: $26,60", "Envío: Gratis", "Total: $26,60", "Nombre: Ana Ruiz", "Celular: 098 123 4567", "Ciudad/cantón: Cuenca", "Dirección: Calle Larga 7-45 y Borrero", "Pago: contra entrega"])
    assert.ok(m.includes(t), t);
  assert.ok(!/cápsula|frasco|FLO/i.test(m), "sin restos de otros productos");
});

test("ficha técnica: datos entregados, sin datos inventados", () => {
  const f = Object.fromEntries(ESPECIFICACIONES_CINTURON);
  assert.equal(f["Modelo"], "JY-2678");
  assert.equal(f["Zona de colocación"], "Abdomen");
  assert.match(f["Alimentación"], /USB de 5 V/);
  assert.equal(f["Largo"], "100 cm, ajustable");
  assert.equal(f["Alto"], "20 cm");
  const todo = JSON.stringify(ESPECIFICACIONES_CINTURON);
  for (const x of ["°C", "batería incorporada", "inalámbric", "lavadora", "0,4 kg", "20 × 5 × 15"]) assert.ok(!todo.includes(x), x);
});

test("catálogo: FLO ya no existe", () => {
  assert.equal(productoPorId("flo"), undefined);
  assert.equal(productoPorId("cinturon")?.id, "cinturon");
});
