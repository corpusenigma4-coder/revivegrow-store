import { test } from "node:test";
import assert from "node:assert/strict";
import { CATALOGO, productoPorId } from "../../src/config/catalogo.ts";
import {
  ahorroPaquete, costoPorDiaCentavos, diasDeConsumo, formatoPorcentaje, formatoUSD, mensajePedido, paquetePorId, totalPedido, validarPedido,
} from "../../src/lib/pedido.ts";
import { RESENAS_FLO } from "../../src/data/resenas-flo.ts";

const flo = CATALOGO.flo;
const dos = paquetePorId("dos", flo)!;
const uno = paquetePorId("uno", flo)!;

test("FLO: precios Black Friday y ahorro real", () => {
  assert.equal(formatoUSD(uno.precioCentavos), "$26,60");
  assert.equal(formatoUSD(dos.precioCentavos), "$35,00");
  const a = ahorroPaquete(dos, flo);
  assert.equal(a.porSeparadoCentavos, 5320); // 2 × 26,60
  assert.equal(a.ahorroCentavos, 1820); // 53,20 − 35,00
  assert.equal(formatoPorcentaje(a.porcentaje), "34,2 %");
  assert.equal(a.precioPorFrascoCentavos, 1750);
  assert.equal(flo.paqueteInicial, "dos");
  assert.equal(dos.destacado, true);
});

test("FLO: 90 cápsulas, 3 al día → 30 días por frasco", () => {
  assert.equal(flo.diasPorFrasco, 30);
  assert.equal(diasDeConsumo(dos, flo.diasPorFrasco), 60);
  assert.equal(costoPorDiaCentavos(dos, flo.diasPorFrasco), 58);
  assert.equal(dos.capsulas, 180);
});

test("FLO: envío gratis en cualquier provincia; TESTO-GH sigue por confirmar", () => {
  const t = totalPedido(dos, "Loja", flo.envio);
  assert.deepEqual(t.envio, { estado: "definido", centavos: 0 });
  assert.equal(t.totalCentavos, 3500);
  assert.equal(totalPedido(paquetePorId("dos")!, "Loja").totalCentavos, null);
  assert.equal(paquetePorId("dos")!.precioCentavos, 3740);
});

test("FLO: mensaje de WhatsApp con producto, cantidad, precio, envío gratis y total", () => {
  const v = validarPedido(
    { nombre: "Ana Ruiz", celular: "0981234567", provincia: "Azuay", ciudad: "Cuenca", direccion: "Calle Larga 7-45 y Borrero", referencia: "Puerta verde", paquete: "dos", acepta: true },
    { producto: flo },
  );
  assert.equal(v.ok, true);
  const m = mensajePedido({ numero: "RG-1", fecha: new Date("2026-11-20T15:00:00Z"), datos: v.datos, paquete: v.paquete!, producto: flo });
  for (const t of ["Producto: FLO Ovarian Support — O Positiv Health (90 cápsulas por frasco)", "Cantidad: 2 frascos (180 cápsulas)", "Precio del paquete: $35,00", "Envío: Gratis", "Total: $35,00", "Dirección: Calle Larga 7-45 y Borrero", "Provincia: Azuay"])
    assert.ok(m.includes(t), t);
});

test("catálogo: ids válidos e inválidos", () => {
  assert.equal(productoPorId("flo")?.id, "flo");
  assert.equal(productoPorId("testo-gh")?.id, "testo-gh");
  assert.equal(productoPorId("otro"), undefined);
  assert.equal(productoPorId({}), undefined);
});

test("las 4 reseñas entregadas, completas", () => {
  assert.deepEqual(RESENAS_FLO.map((r) => r.nombre), ["Violeta", "Nicole A.", "Cindy", "Rebeca"]);
  for (const r of RESENAS_FLO) assert.ok(r.texto.length > 60 && r.titulo.length > 3);
});
