/**
 * Tests navigateur (Playwright + Chromium) sur le build de production servi par `astro preview`.
 * Usage : npm run build && npm run test:e2e   (captures dans screenshots/)
 */
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import assert from "node:assert/strict";
import { chromium, devices } from "playwright";

const PORT = 4321;
const BASE = `http://127.0.0.1:${PORT}`;
const PAGES = ["/", "/oreiller-cervical-ajustable", "/mentions-legales", "/cgv", "/livraison-retours", "/garantie-90-jours",
  "/garanties-legales", "/retractation", "/confidentialite", "/cookies", "/contact", "/systeme"];
const SHOTS = process.env.SHOTS !== "0";
mkdirSync("screenshots", { recursive: true });

const server = spawn("npx", ["astro", "preview", "--port", String(PORT), "--host", "127.0.0.1"], { stdio: "pipe" });
const stop = () => { try { server.kill("SIGTERM"); } catch {} };
process.on("exit", stop);

async function waitUp() {
  for (let i = 0; i < 60; i++) {
    try { const r = await fetch(BASE + "/"); if (r.ok) return; } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error("Le serveur de prévisualisation ne répond pas");
}

let failures = 0, passes = 0;
async function t(name, fn) {
  try { await fn(); passes++; console.log("  ✓", name); }
  catch (e) { failures++; console.error("  ✗", name, "\n    ", e.message.split("\n").slice(0, 4).join("\n     ")); }
}

await waitUp();
const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
const mobile = { ...devices["iPhone 13"], locale: "fr-FR", timezoneId: "Europe/Paris" };
const desktop = { viewport: { width: 1440, height: 900 }, locale: "fr-FR", timezoneId: "Europe/Paris" };

console.log("Pages");
for (const path of PAGES) {
  await t(`${path} : statut, langue, h1 unique, noindex, pas d'erreur console, pas de débordement à 360 px`, async () => {
    const ctx = await browser.newContext({ ...mobile, viewport: { width: 360, height: 780 } });
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    const res = await page.goto(BASE + path, { waitUntil: "networkidle" });
    assert.equal(res.status(), 200);
    assert.equal(await page.getAttribute("html", "lang"), "fr-FR");
    assert.equal(await page.locator("h1").count(), 1, "un seul h1");
    assert.match(await page.getAttribute('meta[name="robots"]', "content"), /noindex/);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert.ok(overflow <= 0, `débordement horizontal de ${overflow}px`);
    const noAlt = await page.locator("img:not([alt])").count();
    assert.equal(noAlt, 0, "images sans attribut alt");
    assert.deepEqual(errors, []);
    await ctx.close();
  });
}

await t("liens internes : tous résolus", async () => {
  const ctx = await browser.newContext(desktop); const page = await ctx.newPage();
  const hrefs = new Set();
  for (const p of PAGES) {
    await page.goto(BASE + p);
    for (const h of await page.$$eval("a[href^='/']", (as) => as.map((a) => a.getAttribute("href")))) hrefs.add(h.split("#")[0] || "/");
  }
  for (const h of hrefs) { const r = await fetch(BASE + h); assert.equal(r.status, 200, `${h} → ${r.status}`); }
  await ctx.close();
});

console.log("Campagne");
await t("pendant l'offre (5 nov.) : compte à rebours visible, pas de message d'urgence", async () => {
  const ctx = await browser.newContext(mobile); const page = await ctx.newPage();
  await page.clock.install({ time: new Date("2026-11-05T10:00:00+01:00") });
  await page.goto(BASE + "/oreiller-cervical-ajustable");
  assert.equal(await page.getAttribute("html", "data-phase"), "active");
  const cd = page.locator(".buy [data-countdown-text]");
  await cd.waitFor();
  assert.match(await cd.textContent(), /^6 j 13 h 59 min$/);
  assert.equal(await page.locator(".buy [data-phase-message='urgency']").isVisible(), false);
  await ctx.close();
});
await t("derniers jours (10 nov.) : message « Derniers jours »", async () => {
  const ctx = await browser.newContext(mobile); const page = await ctx.newPage();
  await page.clock.install({ time: new Date("2026-11-10T08:00:00+01:00") });
  await page.goto(BASE + "/oreiller-cervical-ajustable");
  assert.equal(await page.getAttribute("html", "data-phase"), "last-days");
  assert.match(await page.locator(".buy [data-phase-message='urgency']").textContent(), /Derniers jours/);
  await ctx.close();
});
await t("après l'échéance (12 nov.) : offre terminée, compteur arrêté, aucun redémarrage", async () => {
  const ctx = await browser.newContext(mobile); const page = await ctx.newPage();
  await page.clock.install({ time: new Date("2026-11-12T00:00:01+01:00") });
  await page.goto(BASE + "/oreiller-cervical-ajustable");
  assert.equal(await page.getAttribute("html", "data-phase"), "ended");
  assert.equal(await page.locator(".buy__ended").isVisible(), true);
  assert.equal(await page.locator(".buy__live").isVisible(), false);
  assert.equal(await page.locator("[data-countdown]:visible").count(), 0);
  await page.clock.runFor(3 * 3600_000);
  assert.equal(await page.getAttribute("html", "data-phase"), "ended");
  await ctx.close();
});
await t("transition en direct : 23 h 59 → offre terminée sans rechargement", async () => {
  const ctx = await browser.newContext(mobile); const page = await ctx.newPage();
  await page.clock.install({ time: new Date("2026-11-11T23:58:30+01:00") });
  await page.goto(BASE + "/");
  assert.equal(await page.getAttribute("html", "data-phase"), "last-day");
  await page.clock.runFor(150_000);
  assert.equal(await page.getAttribute("html", "data-phase"), "ended");
  await ctx.close();
});

console.log("Commerce et honnêteté");
await t("aucun prix barré ni pourcentage sans justificatif ; prix 32,40 € TTC", async () => {
  const ctx = await browser.newContext(desktop); const page = await ctx.newPage();
  await page.goto(BASE + "/");
  const body = await page.locator("body").innerText();
  assert.ok(!/−\s?40|-\s?40\s?%/.test(body), "pourcentage affiché");
  assert.equal(await page.locator(".price__ref").count(), 0);
  assert.match(body, /32,40 €/);
  await ctx.close();
});
await t("pas de faux bouton de paiement : commande désactivée en phase 1", async () => {
  const ctx = await browser.newContext(mobile); const page = await ctx.newPage();
  await page.goto(BASE + "/oreiller-cervical-ajustable");
  assert.equal(await page.locator("#commander button[data-offer-action]").isDisabled(), true);
  assert.equal(await page.locator("script[src*='paypal.com']").count(), 0);
  await ctx.close();
});
await t("les deux cadeaux sont présentés comme offerts dans le bloc d'achat", async () => {
  const ctx = await browser.newContext(mobile); const page = await ctx.newPage();
  await page.goto(BASE + "/oreiller-cervical-ajustable");
  assert.equal(await page.locator("#commander .pack__tag--gift").count(), 2);
  await ctx.close();
});

console.log("Interactions");
await t("configurateur : 14 cm → 2 inserts, annonce accessible", async () => {
  const ctx = await browser.newContext(mobile); const page = await ctx.newPage();
  await page.goto(BASE + "/#reglage");
  const cfg = page.locator("[data-cfg]").first();
  await cfg.locator("label.cfg__opt", { hasText: "14" }).click();
  assert.equal(await cfg.getAttribute("data-layers"), "2");
  assert.equal(await cfg.locator("[data-cfg-value]").textContent(), "14 cm");
  assert.match(await cfg.locator("[data-cfg-live]").textContent(), /14 centimètres/);
  await cfg.locator("[data-cfg-step='open']").click();
  assert.equal(await cfg.getAttribute("data-step"), "open");
  await page.keyboard.press("Tab");
  await ctx.close();
});
await t("menu mobile : ouverture, fermeture par Échap", async () => {
  const ctx = await browser.newContext(mobile); const page = await ctx.newPage();
  await page.goto(BASE + "/");
  await page.locator("[data-menu-open]").click();
  assert.equal(await page.locator("#menu").isVisible(), true);
  await page.keyboard.press("Escape");
  assert.equal(await page.locator("#menu").isVisible(), false);
  await ctx.close();
});
await t("barre d'achat mobile : cachée sur le hero, visible après défilement", async () => {
  const ctx = await browser.newContext(mobile); const page = await ctx.newPage();
  await page.goto(BASE + "/");
  assert.equal(await page.locator("[data-sticky]").evaluate((el) => el.classList.contains("is-on")), false);
  await page.mouse.wheel(0, 1600); await page.waitForTimeout(500);
  assert.equal(await page.locator("[data-sticky]").evaluate((el) => el.classList.contains("is-on")), true);
  await ctx.close();
});

if (SHOTS) {
  console.log("Captures");
  const freeze = new Date("2026-11-05T10:00:00+01:00");
  for (const [name, opts] of [["mobile", { ...devices["iPhone 13"], locale: "fr-FR", timezoneId: "Europe/Paris" }], ["desktop", { ...desktop, deviceScaleFactor: 1 }]]) {
    for (const [slug, path] of [["accueil", "/"], ["produit", "/oreiller-cervical-ajustable"], ["systeme", "/systeme"], ["mentions", "/mentions-legales"]]) {
      const ctx = await browser.newContext({ ...opts, reducedMotion: "reduce" }); const page = await ctx.newPage();
      await page.clock.install({ time: freeze });
      await page.goto(BASE + path, { waitUntil: "networkidle" });
      await page.evaluate(async () => {
        document.querySelectorAll("[data-reveal]").forEach((e) => e.classList.add("is-visible"));
        document.querySelectorAll("img[loading=lazy]").forEach((i) => { i.loading = "eager"; });
        await Promise.all(Array.from(document.images).map((i) => i.complete ? null : new Promise((r) => { i.onload = i.onerror = r; })));
        const s = document.querySelector("[data-sticky]"); if (s) s.style.display = "none";
      });
      await page.screenshot({ path: `screenshots/${slug}-${name}-ecran1.png` });
      await page.screenshot({ path: `screenshots/${slug}-${name}.png`, fullPage: true });
      await ctx.close();
    }
  }
  for (const [name, opts] of [["mobile", devices["iPhone 13"]], ["desktop", { ...desktop, deviceScaleFactor: 1 }]]) {
    const ctx = await browser.newContext({ ...opts, reducedMotion: "reduce" }); const page = await ctx.newPage();
    await page.clock.install({ time: freeze });
    await page.goto(BASE + "/");
    const sec = page.locator("#reglage");
    await sec.evaluate((el) => el.querySelectorAll("[data-reveal]").forEach((e) => e.classList.add("is-visible")));
    await sec.locator("label.cfg__opt").nth(2).click();
    await page.waitForTimeout(200);
    await sec.screenshot({ path: `screenshots/configurateur-${name}.png` });
    await ctx.close();
  }
  console.log("  → screenshots/");
}

await browser.close();
stop();
console.log(`\n${passes} réussis, ${failures} en échec`);
process.exit(failures ? 1 : 0);
