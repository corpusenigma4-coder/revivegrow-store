/**
 * Pruebas en navegador (Chromium/Playwright) sobre el build de producción (`astro preview`).
 * Verifica: precios y cálculos visibles, selector de paquetes, formulario (validación, revisión,
 * WhatsApp prellenado y modalidad servidor simulada), botón de WhatsApp, páginas legales,
 * ausencia de desbordamiento horizontal en móvil y capturas de pantalla.
 */
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { chromium, devices } from "playwright";
import assert from "node:assert/strict";

const PORT = 4329;
const BASE = `http://127.0.0.1:${PORT}`;
const OUT = process.env.SCREENSHOTS_DIR ?? "screenshots";
mkdirSync(OUT, { recursive: true });

const server = spawn("npx", ["astro", "preview", "--port", String(PORT), "--host", "127.0.0.1"], { stdio: "pipe" });
const listo = async () => {
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(BASE)).ok) return; } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("El servidor de vista previa no arrancó");
};

let fallos = 0;
const prueba = async (nombre, fn) => {
  try { await fn(); console.log(`✔ ${nombre}`); }
  catch (e) { fallos++; console.error(`✖ ${nombre}\n  ${e.stack?.split("\n").slice(0, 4).join("\n  ")}`); }
};

const datos = {
  nombre: "Carlos Andrade", celular: "099 876 5432", provincia: "Pichincha", ciudad: "Quito",
  direccion: "Av. 6 de Diciembre N34-12 y Portugal", referencia: "Edificio gris, junto a la panadería",
};
async function revelarTodo(page) {
  for (let y = 0; y < 20000; y += 600) { await page.evaluate((v) => window.scrollTo(0, v), y); await page.waitForTimeout(60); }
  await page.waitForTimeout(700);
}
async function llenar(page) {
  await page.fill("#f-nombre", datos.nombre);
  await page.fill("#f-celular", datos.celular);
  await page.selectOption("#f-provincia", datos.provincia);
  await page.fill("#f-ciudad", datos.ciudad);
  await page.fill("#f-direccion", datos.direccion);
  await page.fill("#f-referencia", datos.referencia);
  await page.check("#f-acepta");
}

try {
  await listo();
  const browser = await chromium.launch();
  const movil = { ...devices["iPhone 13"] };
  const nuevaPagina = async (ctxOpts = movil) => {
    const ctx = await browser.newContext({ ...ctxOpts, locale: "es-EC" });
    const page = await ctx.newPage();
    const errores = [];
    page.on("pageerror", (e) => errores.push(e.message));
    page.on("console", (m) => { if (m.type() === "error" && !/api\/pedido/.test(m.text()) && !/404/.test(m.text())) errores.push(m.text()); });
    return { ctx, page, errores };
  };

  await prueba("Inicio en móvil: TESTO-GH, precios, ahorro y sin desbordamiento", async () => {
    const { ctx, page, errores } = await nuevaPagina();
    await page.goto(BASE + "/");
    await assert.doesNotReject(page.waitForSelector("h1:has-text('TESTO-GH')"));
    const texto = await page.textContent("body");
    for (const t of ["TESTO-GH", "Multi Vitamin For Men", "GENETICS Nutrition & Business", "$37,40", "$27,40", "AHORRA $17,40", "31,8 %", "$18,70 c/u", "$54,80", "120 cápsulas", "60 cápsulas", "PEDIR AHORA — PAGA AL RECIBIR", "Unidades limitadas", "Alta demanda: se está vendiendo rápido", "Pide hoy y recíbelo", "2 a 3 días hábiles", "10 ingredientes", "30 días", "60 días", "$0,62 por día", "Ácido D-aspártico", "Ashwagandha KSM-66®", "500 mg", "Vitamina D3", "No usar en menores de 15 años", "Revisa la etiqueta"])
      assert.ok(texto.includes(t), `falta «${t}»`);
    for (const prohibido of ["testosterona", "testosterone", "músculo", "masa muscular", "libido", "optimizador hormonal", "hormona de crecimiento", "liberación nocturna", "anabólic", "grasa", "más fuerza", "energía total", "garantizado", "comprobado", "certificad", "cura ", "días de uso"])
      assert.ok(!texto.toLowerCase().includes(prohibido.toLowerCase()), `texto no permitido: «${prohibido}»`);
    assert.equal(await page.locator("input[name='paquete-hero'][value='dos']").isChecked(), true, "2 frascos preseleccionado");
    const ancho = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    assert.ok(ancho <= 0, `desbordamiento horizontal de ${ancho}px`);
    assert.match(await page.textContent("#comprar [data-entrega]"), /^entre el (lunes|martes|miércoles|jueves|viernes) \d+/);
    assert.equal(await page.getAttribute("meta[name=robots]", "content"), "index, follow");
    assert.equal(await page.locator(".preview-bar").count(), 0, "sin barra de vista previa");
    assert.ok(!texto.includes("Vista previa") && !texto.includes("PRUEBA") && !texto.includes("Pendiente"), "sin avisos internos");
    await page.screenshot({ path: `${OUT}/movil-inicio.png` });
    await revelarTodo(page);
    await page.screenshot({ path: `${OUT}/movil-completa.png`, fullPage: true });
    assert.deepEqual(errores, []);
    await ctx.close();
  });

  await prueba("Selector de paquetes sincronizado (sin cambios automáticos)", async () => {
    const { ctx, page } = await nuevaPagina();
    await page.goto(BASE + "/");
    await page.click("label:has(input[name='paquete-hero'][value='uno'])");
    assert.equal(await page.locator("input[name='paquete-oferta'][value='uno']").isChecked(), true);
    assert.equal(await page.locator("input[name='paquete-dialogo'][value='uno']").isChecked(), true);
    assert.equal((await page.textContent("#comprar [data-sel-precio]")).trim(), "$27,40");
    await page.mouse.wheel(0, 2500);
    await page.waitForSelector("[data-sticky][data-visible]");
    assert.equal((await page.textContent("[data-sticky] [data-sel-precio]")).trim(), "$27,40");
    await page.screenshot({ path: `${OUT}/movil-barra-fija.png` });
    await ctx.close();
  });

  await prueba("Pedido sin servidor: validación, revisión y WhatsApp prellenado (modalidad A)", async () => {
    const { ctx, page, errores } = await nuevaPagina();
    await page.goto(BASE + "/");
    await page.click("#comprar [data-abrir-pedido]");
    await page.waitForSelector("#dlg-pedido[open]");
    await page.click("[data-btn-revisar]");
    for (const c of ["nombre", "celular", "provincia", "ciudad", "direccion", "referencia", "acepta"])
      assert.ok(await page.locator(`[data-campo='${c}'][data-error]`).count(), `sin error en ${c}`);
    await page.screenshot({ path: `${OUT}/movil-formulario-errores.png` });
    await llenar(page);
    assert.match(await page.textContent("[data-envio-hint]"), /Por confirmar/);
    await page.click("[data-btn-revisar]");
    await page.waitForSelector("[data-paso='2']:not([hidden])");
    const resumen = await page.textContent("[data-paso='2']");
    for (const t of ["2 frascos (120 cápsulas)", "TESTO-GH Multi Vitamin For Men", "$37,40", "Por confirmar", "$37,40 + envío por confirmar", "Carlos Andrade", "099 876 5432", "Quito, Pichincha"])
      assert.ok(resumen.includes(t), `resumen sin «${t}»`);
    assert.equal(await page.locator("[data-confirmar]").isHidden(), true, "sin servidor no hay botón de confirmar");
    const href = await page.getAttribute("[data-enviar-wa]", "href");
    assert.ok(href.startsWith("https://wa.me/593960702682?text="));
    const msg = decodeURIComponent(href.split("text=")[1]);
    assert.ok(!msg.includes("PRUEBA"), "el pedido no se marca como prueba");
    assert.ok(resumen.includes("Entrega estimada"), "la revisión muestra la entrega estimada");
    for (const t of ["Entrega estimada: 2 a 3 días hábiles", "Pedido: RG-", "Nombre: Carlos Andrade", "Celular: 099 876 5432", "Provincia: Pichincha", "Ciudad/cantón: Quito", "Dirección: Av. 6 de Diciembre", "Referencia: Edificio gris", "Producto: TESTO-GH", "Cantidad: 2 frascos (120 cápsulas)", "Precio del paquete: $37,40", "Envío: por confirmar", "Total: $37,40 + envío por confirmar", "Fecha: "])
      assert.ok(msg.includes(t), `mensaje sin «${t}»`);
    await page.screenshot({ path: `${OUT}/movil-revision.png` });
    const [popup] = await Promise.all([ctx.waitForEvent("page"), page.click("[data-enviar-wa]")]);
    await popup.close().catch(() => {});
    await page.waitForSelector("[data-resultado='wa']:not([hidden])");
    const final = await page.textContent("[data-paso='3']");
    assert.ok(final.includes("Falta un paso") && final.includes("aún no nos ha llegado"));
    assert.ok(!final.includes("Pedido registrado") || (await page.locator("[data-resultado='ok']").isHidden()));
    await page.screenshot({ path: `${OUT}/movil-falta-un-paso.png` });
    assert.deepEqual(errores, []);
    await ctx.close();
  });

  await prueba("Pedido con servidor simulado (modalidad B): confirmación con número", async () => {
    const { ctx, page } = await nuevaPagina();
    let cuerpo = null;
    await page.route("**/api/pedido", async (route) => {
      const req = route.request();
      if (req.method() === "GET") return route.fulfill({ json: { activo: true, notificacionWhatsApp: true, turnstileSiteKey: null } });
      cuerpo = req.postDataJSON();
      return route.fulfill({ json: { ok: true, numero: "RG-261113-TEST2", duplicado: false, notificado: true } });
    });
    await page.goto(BASE + "/");
    await page.click("#comprar [data-abrir-pedido]");
    await llenar(page);
    await page.waitForTimeout(4100);
    await page.click("[data-btn-revisar]");
    await page.waitForSelector("[data-confirmar]:not([hidden])");
    assert.equal(await page.locator("[data-enviar-wa]").isHidden(), true);
    await page.click("[data-confirmar]");
    await page.waitForSelector("[data-resultado='ok']:not([hidden])");
    assert.equal((await page.textContent("[data-resultado='ok'] [data-numero]")).trim(), "RG-261113-TEST2");
    assert.equal(cuerpo.paquete, "dos");
    assert.equal(cuerpo.celular, "0998765432");
    assert.ok(cuerpo.transcurridoMs >= 4000 && cuerpo.clave.length >= 16 && cuerpo.empresa_web === "");
    assert.equal(await page.locator("[data-wa-respaldo]").isHidden(), true, "notificado: sin botón de respaldo");
    await page.screenshot({ path: `${OUT}/movil-pedido-registrado.png` });
    await ctx.close();
  });

  await prueba("Servidor con error: no se muestra confirmación y se ofrece WhatsApp", async () => {
    const { ctx, page } = await nuevaPagina();
    await page.route("**/api/pedido", (route) =>
      route.request().method() === "GET"
        ? route.fulfill({ json: { activo: true, turnstileSiteKey: null } })
        : route.fulfill({ status: 500, json: { ok: false, codigo: "ERROR_GUARDADO" } }));
    await page.goto(BASE + "/");
    await page.click("#comprar [data-abrir-pedido]");
    await llenar(page);
    await page.click("[data-btn-revisar]");
    await page.click("[data-confirmar]");
    await page.waitForSelector("[data-error-envio]:not([hidden])");
    assert.match(await page.textContent("[data-error-envio]"), /no se ha guardado/);
    assert.equal(await page.locator("[data-enviar-wa]").isVisible(), true);
    assert.equal(await page.locator("[data-resultado='ok']").isHidden(), true);
    await ctx.close();
  });

  await prueba("Botón atrás de Android cierra el formulario sin salir de la página", async () => {
    const { ctx, page } = await nuevaPagina();
    await page.goto(BASE + "/");
    await page.click("#comprar [data-abrir-pedido]");
    await page.waitForSelector("#dlg-pedido[open]");
    await page.goBack();
    await page.waitForSelector("#dlg-pedido:not([open])", { state: "attached" });
    assert.equal(new URL(page.url()).pathname, "/");
    await ctx.close();
  });

  await prueba("WhatsApp flotante, galería y etiqueta ampliable", async () => {
    const { ctx, page } = await nuevaPagina();
    await page.goto(BASE + "/");
    const href = await page.getAttribute(".fab", "href");
    assert.ok(href.startsWith("https://wa.me/593960702682?text="));
    assert.match(decodeURIComponent(href), /TESTO-GH/);
    // Galería del hero: 3 imágenes, se desliza y los puntos siguen la posición
    assert.equal(await page.locator("[data-galeria] .gal__slide").count(), 3);
    await page.locator("[data-gal-track]").evaluate((t) => t.scrollTo({ left: t.clientWidth * 2 }));
    await page.waitForFunction(() => document.querySelectorAll("[data-gal-dot]")[2].classList.contains("is-on"));
    await page.screenshot({ path: `${OUT}/movil-galeria-etiqueta.png` });
    // Etiqueta ampliable
    const b = page.locator("[data-ampliar]").first();
    await b.evaluate((el) => el.scrollIntoView({ block: "center" }));
    await b.click();
    await page.waitForSelector("#dlg-imagen[open] img[src*='etiqueta']");
    await ctx.close();
  });

  await prueba("Escritorio: diseño a dos columnas y diálogo centrado", async () => {
    const { ctx, page, errores } = await nuevaPagina({ viewport: { width: 1366, height: 860 } });
    await page.goto(BASE + "/");
    await page.waitForFunction(() => [...document.querySelectorAll(".hero__media img[loading=eager]")].every((i) => i.complete && i.naturalWidth > 0));
    await page.screenshot({ path: `${OUT}/escritorio-inicio.png` });
    await revelarTodo(page);
    await page.screenshot({ path: `${OUT}/escritorio-completa.png`, fullPage: true });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.click("#comprar [data-abrir-pedido]");
    await page.waitForSelector("#dlg-pedido[open]");
    await page.screenshot({ path: `${OUT}/escritorio-formulario.png` });
    assert.deepEqual(errores, []);
    await ctx.close();
  });

  await prueba("Páginas legales y contacto: cargan, enlaces internos válidos y pendientes visibles", async () => {
    const { ctx, page } = await nuevaPagina();
    const visitadas = new Set();
    for (const ruta of ["/", "/cinturon-termico/", "/privacidad/", "/terminos/", "/envios/", "/devoluciones/", "/contacto/"]) {
      const r = await page.goto(BASE + ruta);
      assert.equal(r.status(), 200, ruta);
      assert.equal(await page.locator("mark.pendiente, .preview-bar").count(), 0, `${ruta} muestra avisos internos`);
      const t = await page.textContent("main");
      for (const x of ["Pendiente", "{{P:", "PRUEBA", "Vista previa", "src/config"]) assert.ok(!t.includes(x), `${ruta} contiene «${x}»`);
      for (const h of await page.$$eval("a[href^='/']", (as) => as.map((a) => a.getAttribute("href").split("#")[0])))
        if (h && !visitadas.has(h)) { visitadas.add(h); assert.equal((await fetch(BASE + h)).status, 200, `enlace roto ${h}`); }
    }
    await page.goto(BASE + "/privacidad/");
    await page.screenshot({ path: `${OUT}/movil-privacidad.png` });
    await ctx.close();
  });

  /* ======================================================== Cinturón térmico con masaje */
  const CIN = BASE + "/cinturon-termico/";

  await prueba("Cinturón en móvil: producto, Black Friday, precios, ficha y precauciones", async () => {
    const { ctx, page, errores } = await nuevaPagina();
    const r = await page.goto(CIN);
    assert.equal(r.status(), 200);
    await page.waitForSelector("h1:has-text('Cinturón térmico con masaje')");
    assert.equal(await page.getAttribute("body", "data-producto"), "cinturon");
    const texto = await page.textContent("body");
    for (const t of ["BLACK FRIDAY", "$35,00", "$26,60", "AHORRA $18,20", "$53,20", "$17,50 c/u", "Envío totalmente gratis", "JY-2678", "Abdomen", "USB de 5 V", "100 cm, ajustable", "20 cm", "Tejido suave tipo felpa", "Banda envolvente ajustable", "Contenido del paquete", "Ajústalo sin apretar", "Mantén secas las partes eléctricas", "No lo uses mientras duermes", "No lo uses sobre piel dañada", "Suspende su uso si sientes molestias o calor excesivo", "PEDIR AHORA — PAGA AL RECIBIR", "Alta demanda: se está vendiendo rápido", "2 a 3 días hábiles", "Cómo se coloca", "Calor", "Masaje"])
      assert.ok(texto.includes(t), `falta «${t}»`);
    for (const prohibido of ["FLO", "cápsula", "Ovarian", "inositol", "Violeta", "Rebeca", "$8", "$15", "°C", "inalámbric", "batería incorporada", "lavadora", "grasa", "reduce medidas", "hormonal", "0,4 kg", "20 × 5 × 15", "AmanGO"])
      assert.ok(!texto.includes(prohibido), `texto no permitido: «${prohibido}»`);
    assert.equal(await page.locator("input[name='paquete-hero'][value='dos']").isChecked(), true);
    assert.equal(await page.locator("[data-galeria] .gal__slide").count(), 4);
    assert.equal(await page.locator(".detalle").count(), 4);
    const ancho = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    assert.ok(ancho <= 0, `desbordamiento horizontal de ${ancho}px`);
    assert.match(await page.getAttribute("meta[property='og:image']", "content"), /og-cinturon\.jpg$/);
    assert.match(await page.title(), /Cinturón térmico con masaje/);
    for (const alt of await page.$$eval("img", (is) => is.map((i) => i.alt))) assert.ok(!/FLO|cápsula/i.test(alt), alt);
    await page.waitForFunction(() => [...document.querySelectorAll(".rosa-media img[loading=eager]")].every((i) => i.complete && i.naturalWidth > 0));
    await page.screenshot({ path: `${OUT}/cinturon-movil-inicio.png` });
    assert.deepEqual(errores, []);
    await ctx.close();
  });

  await prueba("Cinturón: ambas ofertas calculan bien y el pedido por WhatsApp identifica el producto", async () => {
    const { ctx, page, errores } = await nuevaPagina();
    await page.goto(CIN);
    // 1 cinturón
    await page.click("label:has(input[name='paquete-hero'][value='uno'])");
    assert.equal((await page.textContent("#comprar [data-sel-precio]")).trim(), "$26,60");
    await page.click("#comprar [data-abrir-pedido]");
    await page.waitForSelector("#dlg-pedido[open]");
    assert.equal(await page.locator("input[name='paquete-dialogo'][value='uno']").isChecked(), true);
    await llenar(page);
    await page.click("[data-btn-revisar]");
    await page.waitForSelector("[data-paso='2']:not([hidden])");
    let resumen = await page.textContent("[data-paso='2']");
    for (const t of ["Cinturón térmico con masaje REVIVEGROW — modelo JY-2678", "1 cinturón (modelo JY-2678)", "Gratis", "$26,60"]) assert.ok(resumen.includes(t), `resumen sin «${t}»`);
    let msg = decodeURIComponent((await page.getAttribute("[data-enviar-wa]", "href")).split("text=")[1]);
    assert.ok(msg.includes("Total: $26,60") && msg.includes("Cantidad: 1 cinturón"), msg);
    // Cambiar a 2 cinturones desde el formulario: el total se actualiza
    await page.click("[data-volver]");
    await page.click("label:has(input[name='paquete-dialogo'][value='dos'])");
    await page.click("[data-btn-revisar]");
    await page.waitForSelector("[data-paso='2']:not([hidden])");
    resumen = await page.textContent("[data-paso='2']");
    assert.ok(resumen.includes("2 cinturones (modelo JY-2678)") && resumen.includes("$35,00"), resumen);
    assert.equal(await page.locator("[data-alerta-envio]").isHidden(), true);
    assert.ok((await page.getAttribute("[data-enviar-wa]", "href")).startsWith("https://wa.me/593960702682?text="));
    msg = decodeURIComponent((await page.getAttribute("[data-enviar-wa]", "href")).split("text=")[1]);
    for (const t of ["Producto: Cinturón térmico con masaje REVIVEGROW, modelo JY-2678", "Cantidad: 2 cinturones (modelo JY-2678)", "Precio del paquete: $35,00", "Envío: Gratis", "Total: $35,00", "Nombre: Carlos Andrade", "Celular: 099 876 5432", "Ciudad/cantón: Quito", "Provincia: Pichincha", "Dirección: Av. 6 de Diciembre", "Pago: contra entrega", "Entrega estimada: 2 a 3 días hábiles"])
      assert.ok(msg.includes(t), `mensaje sin «${t}»`);
    assert.ok(!/cápsula|FLO|frasco/i.test(msg), "mensaje con restos de otro producto");
    assert.ok((await page.textContent("[data-paso='2']")).includes("pulsar «Enviar» en WhatsApp"));
    await page.screenshot({ path: `${OUT}/cinturon-movil-revision.png` });
    const [popup] = await Promise.all([ctx.waitForEvent("page"), page.click("[data-enviar-wa]")]);
    await popup.close().catch(() => {});
    await page.waitForSelector("[data-resultado='wa']:not([hidden])");
    assert.deepEqual(errores, []);
    await ctx.close();
  });

  await prueba("Cinturón: todos los botones de compra abren el formulario; servidor recibe producto=cinturon", async () => {
    const { ctx, page } = await nuevaPagina();
    let cuerpo = null;
    await page.route("**/api/pedido", (route) =>
      route.request().method() === "GET"
        ? route.fulfill({ json: { activo: true, notificacionWhatsApp: true, turnstileSiteKey: null } })
        : ((cuerpo = route.request().postDataJSON()), route.fulfill({ json: { ok: true, numero: "RG-261120-CIN22", notificado: true } })));
    await page.goto(CIN);
    const botones = await page.locator("main [data-abrir-pedido]").count();
    assert.equal(botones, 2, "botones de compra en la página");
    for (let i = 0; i < botones; i++) {
      const b = page.locator("main [data-abrir-pedido]").nth(i);
      await b.scrollIntoViewIfNeeded();
      await b.click();
      await page.waitForSelector("#dlg-pedido[open]");
      await page.click("#dlg-pedido [data-cerrar]");
      await page.waitForSelector("#dlg-pedido:not([open])", { state: "attached" });
    }
    // Botón de la barra fija (móvil)
    await page.mouse.wheel(0, 2500);
    await page.waitForSelector("[data-sticky][data-visible]");
    await page.waitForTimeout(400);
    await page.click("[data-sticky] [data-abrir-pedido]");
    await page.waitForSelector("#dlg-pedido[open]");
    await llenar(page);
    await page.click("[data-btn-revisar]");
    await page.click("[data-confirmar]");
    await page.waitForSelector("[data-resultado='ok']:not([hidden])");
    assert.equal(cuerpo.producto, "cinturon");
    assert.equal(cuerpo.paquete, "dos");
    await ctx.close();
  });

  await prueba("Cinturón: WhatsApp de consultas, redirección desde la dirección anterior y escritorio", async () => {
    const { ctx, page } = await nuevaPagina();
    await page.goto(CIN);
    assert.match(decodeURIComponent(await page.getAttribute(".fab", "href")), /cinturón térmico con masaje JY-2678/);
    await page.goto(BASE + "/flo-ovarian-support/");
    await page.waitForURL(/\/cinturon-termico\/$/);
    await ctx.close();
    const d = await nuevaPagina({ viewport: { width: 1366, height: 860 } });
    await d.page.goto(CIN);
    await d.page.waitForFunction(() => [...document.querySelectorAll(".rosa-media img[loading=eager]")].every((i) => i.complete && i.naturalWidth > 0));
    await d.page.screenshot({ path: `${OUT}/cinturon-escritorio-inicio.png` });
    assert.deepEqual(d.errores, []);
    await d.ctx.close();
  });

  await browser.close();
} finally {
  server.kill();
  // Astro 7 deja el servidor de vista previa en segundo plano: detenerlo.
  spawn("npx", ["astro", "preview", "stop"], { stdio: "ignore" });
}
console.log(fallos ? `\n${fallos} prueba(s) fallida(s). Capturas en ${OUT}/` : `\nTodas las pruebas de navegador pasaron. Capturas en ${OUT}/`);
process.exit(fallos ? 1 : 0);
