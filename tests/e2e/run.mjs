/**
 * Tests navigateur (Playwright + Chromium) sur le build de production, servi comme GitHub Pages.
 * Usage : npm run build && npm run test:e2e   (captures dans screenshots/ ; SHOTS=0 pour les désactiver)
 */
import { mkdirSync, readFileSync, existsSync } from "node:fs";
import assert from "node:assert/strict";
import { chromium, devices } from "playwright";
import { startPagesServer } from "./pages-server.mjs";

const PORT = 4321;
const BASE = `http://127.0.0.1:${PORT}`;
const PAGES = ["/", "/oreiller-cervical-ajustable", "/contact", "/mentions-legales", "/cgv", "/livraison", "/retours", "/garantie-90-jours",
  "/garanties-legales", "/retractation", "/confidentialite", "/cookies", "/systeme"];
const SHOTS = process.env.SHOTS !== "0";
mkdirSync("screenshots", { recursive: true });

const server = await startPagesServer("dist", PORT);
let failures = 0, passes = 0;
async function t(name, fn) {
  try { await fn(); passes++; console.log("  ✓", name); }
  catch (e) { failures++; console.error("  ✗", name, "\n    ", String(e.message).split("\n").slice(0, 5).join("\n     ")); }
}

const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
const iphone = { ...devices["iPhone 13"], locale: "fr-FR", timezoneId: "Europe/Paris" };
const android = { ...devices["Pixel 7"], locale: "fr-FR", timezoneId: "Europe/Paris" };
const desktop = { viewport: { width: 1440, height: 900 }, locale: "fr-FR", timezoneId: "Europe/Paris" };

console.log("GitHub Pages");
await t("dist/CNAME = revivegrow.store, .nojekyll présent, aucun dossier « _ »", async () => {
  assert.equal(readFileSync("dist/CNAME", "utf8").trim(), "revivegrow.store");
  assert.ok(existsSync("dist/.nojekyll"));
  assert.ok(!existsSync("dist/_astro"));
  assert.ok(existsSync("dist/404.html"));
});
await t("URL sans extension et page 404 servies comme sur GitHub Pages", async () => {
  assert.equal((await fetch(BASE + "/contact")).status, 200);
  assert.equal((await fetch(BASE + "/page-inexistante")).status, 404);
});

console.log("Pages");
for (const path of PAGES) {
  await t(`${path} : statut, langue, h1 unique, noindex, sans erreur, sans débordement à 360 px`, async () => {
    const ctx = await browser.newContext({ ...iphone, viewport: { width: 360, height: 780 } });
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    page.on("requestfailed", (r) => errors.push("échec de chargement : " + r.url()));
    const res = await page.goto(BASE + path, { waitUntil: "networkidle" });
    assert.equal(res.status(), 200);
    assert.equal(await page.getAttribute("html", "lang"), "fr-FR");
    assert.equal(await page.locator("h1").count(), 1, "un seul h1");
    assert.match(await page.getAttribute('meta[name="robots"]', "content"), /noindex/);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert.ok(overflow <= 0, `débordement horizontal de ${overflow}px`);
    assert.equal(await page.locator("img:not([alt])").count(), 0, "images sans alt");
    assert.deepEqual(errors, []);
    await ctx.close();
  });
}

await t("liens et ressources internes : tous résolus (200)", async () => {
  const ctx = await browser.newContext(desktop); const page = await ctx.newPage();
  const urls = new Set();
  for (const p of PAGES) {
    await page.goto(BASE + p);
    for (const h of await page.$$eval("a[href^='/'], link[href^='/'], img[src^='/'], source[srcset]", (els) =>
      els.flatMap((el) => el.tagName === "SOURCE" ? el.getAttribute("srcset").split(",").map((x) => x.trim().split(" ")[0]) : [el.getAttribute("href") || el.getAttribute("src")]))) {
      if (h && h.startsWith("/")) urls.add(h.split("#")[0] || "/");
    }
  }
  for (const u of urls) { const r = await fetch(BASE + u); assert.equal(r.status, 200, `${u} → ${r.status}`); }
  await ctx.close();
});

console.log("Offre et honnêteté");
await t("offre active en continu, sans date ni compte à rebours", async () => {
  const ctx = await browser.newContext(iphone); const page = await ctx.newPage();
  await page.goto(BASE + "/");
  assert.equal(await page.locator("[data-countdown]").count(), 0);
  const body = await page.locator("body").innerText();
  assert.match(body, /Offre spéciale Pré-Black Friday/i);
  assert.ok(!/jusqu’au \d/.test(body), "date de fin affichée sans configuration");
  assert.equal(await page.getAttribute("html", "data-offer"), "open");
  await ctx.close();
});
await t("aucun prix barré, aucun pourcentage, aucun stock restant ; 32,40 € et livraison offerte", async () => {
  const ctx = await browser.newContext(desktop); const page = await ctx.newPage();
  await page.goto(BASE + "/");
  const body = await page.locator("body").innerText();
  assert.ok(!/−\s?40|-\s?40\s?%/.test(body), "pourcentage affiché");
  assert.ok(!/(il reste|plus que|derniers? articles?|en stock)/i.test(body), "mention de stock");
  assert.equal(await page.locator(".price__ref").count(), 0);
  assert.match(body, /32,40 €/);
  assert.match(body, /Livraison gratuite/i);
  await ctx.close();
});
await t("politiques : pages en français, mentions manquantes signalées, aucune donnée inventée", async () => {
  for (const p of ["/cgv", "/mentions-legales", "/retours"]) {
    const r = await (await fetch(BASE + p)).text();
    assert.match(r, /À compléter/);
  }
});
await t("pas de faux paiement : bouton désactivé, aucun SDK de paiement chargé", async () => {
  const ctx = await browser.newContext(iphone); const page = await ctx.newPage();
  await page.goto(BASE + "/oreiller-cervical-ajustable");
  assert.equal(await page.locator("#commander button[data-offer-action]").isDisabled(), true);
  assert.equal(await page.locator("script[src*='paypal.com']").count(), 0);
  assert.equal(await page.locator("#commander .pack__tag--gift").count(), 2);
  await ctx.close();
});

console.log("Comparateur avant / après");
for (const [label, dev] of [["iPhone", iphone], ["Android", android]]) {
  await t(`${label} : glisser au doigt révèle progressivement l’image`, async () => {
    const ctx = await browser.newContext({ ...dev, reducedMotion: "reduce" }); const page = await ctx.newPage();
    await page.goto(BASE + "/#difference");
    const frame = page.locator("[data-ba-frame]").first();
    await frame.scrollIntoViewIfNeeded();
    const box = await frame.boundingBox();
    const y = box.y + box.height / 2;
    const cdp = await ctx.newCDPSession(page);
    const touch = (type, x) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x, y }] });
    await touch("touchStart", box.x + box.width * 0.5);
    for (let i = 1; i <= 8; i++) await touch("touchMove", box.x + box.width * (0.5 - i * 0.05));
    await touch("touchEnd");
    await page.waitForTimeout(100);
    const now = Number(await page.locator("[data-ba-handle]").first().getAttribute("aria-valuenow"));
    assert.ok(now >= 5 && now <= 15, `position attendue ≈ 10, obtenue ${now}`);
    const clip = await page.locator(".ba__after").first().evaluate((el) => getComputedStyle(el).clipPath);
    assert.match(clip, /inset\(0px 0px 0px/);
    await ctx.close();
  });
}
await t("clavier : flèches, Origine, Fin", async () => {
  const ctx = await browser.newContext({ ...desktop, reducedMotion: "reduce" }); const page = await ctx.newPage();
  await page.goto(BASE + "/");
  const h = page.locator("[data-ba-handle]").first();
  await h.focus();
  await page.keyboard.press("ArrowRight"); await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(50);
  assert.equal(await h.getAttribute("aria-valuenow"), "54");
  await page.keyboard.press("Home"); await page.waitForTimeout(50);
  assert.equal(await h.getAttribute("aria-valuenow"), "0");
  await page.keyboard.press("End"); await page.waitForTimeout(50);
  assert.equal(await h.getAttribute("aria-valuenow"), "100");
  await ctx.close();
});
await t("images avant/après superposées exactement (mêmes dimensions affichées)", async () => {
  for (const dev of [iphone, desktop]) {
    const ctx = await browser.newContext(dev); const page = await ctx.newPage();
    await page.goto(BASE + "/");
    const boxes = await page.locator("[data-ba-frame] .ba__img").evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); return [r.x, r.y, r.width, r.height].map(Math.round).join(","); }));
    assert.equal(boxes.length, 2); assert.equal(boxes[0], boxes[1]);
    await ctx.close();
  }
});

console.log("Anatomie");
await t("repères posés sur la photo, alignés à 360, 390 et 1440 px", async () => {
  for (const vp of [{ width: 360, height: 780 }, { width: 390, height: 844 }, { width: 1440, height: 900 }]) {
    const ctx = await browser.newContext({ viewport: vp, locale: "fr-FR", reducedMotion: "reduce" }); const page = await ctx.newPage();
    await page.goto(BASE + "/#forme");
    const res = await page.locator("[data-ana]").first().evaluate((root) => {
      const f = root.querySelector(".ana__frame").getBoundingClientRect();
      return Array.from(root.querySelectorAll(".ana__pin")).map((p) => {
        const r = p.getBoundingClientRect(); const cx = r.x + r.width / 2, cy = r.y + r.height / 2;
        return { n: p.dataset.pt, x: ((cx - f.x) / f.width) * 100, y: ((cy - f.y) / f.height) * 100, w: r.width };
      });
    });
    const expect = { 2: [50, 50], 3: [15.5, 48], 4: [84.5, 48] };
    assert.equal(res.length, 3);
    for (const r of res) {
      assert.ok(Math.abs(r.x - expect[r.n][0]) < 0.6 && Math.abs(r.y - expect[r.n][1]) < 0.6, `repère ${r.n} décalé à ${vp.width}px`);
      assert.ok(r.w >= 30, "repère trop petit");
    }
    await ctx.close();
  }
});
await t("toucher un repère met en évidence le point correspondant", async () => {
  const ctx = await browser.newContext({ ...iphone, reducedMotion: "reduce" }); const page = await ctx.newPage();
  await page.goto(BASE + "/#forme");
  await page.locator(".ana__pin[data-pt='2']").first().tap();
  await page.waitForTimeout(400);
  assert.equal(await page.locator(".ana__item[data-pt='2']").first().evaluate((el) => el.classList.contains("is-on")), true);
  await ctx.close();
});

console.log("Contact");
await t("adresse e-mail cliquable ; aucun formulaire non branché affiché", async () => {
  const ctx = await browser.newContext(iphone); const page = await ctx.newPage();
  await page.goto(BASE + "/contact");
  assert.equal(await page.locator("a[href^='mailto:corpusenigma4@gmail.com']").count() >= 2, true);
  assert.equal(await page.locator("[data-form]").count(), 0);
  await ctx.close();
});

console.log("Interactions");
await t("configurateur : 14 cm → 2 inserts, annonce accessible", async () => {
  const ctx = await browser.newContext(iphone); const page = await ctx.newPage();
  await page.goto(BASE + "/#reglage");
  const cfg = page.locator("[data-cfg]").first();
  await cfg.locator("label.cfg__opt", { hasText: "14" }).click();
  assert.equal(await cfg.getAttribute("data-layers"), "2");
  assert.match(await cfg.locator("[data-cfg-live]").textContent(), /14 centimètres/);
  await ctx.close();
});
await t("menu mobile : ouverture, fermeture par Échap", async () => {
  const ctx = await browser.newContext(iphone); const page = await ctx.newPage();
  await page.goto(BASE + "/");
  await page.locator("[data-menu-open]").click();
  assert.equal(await page.locator("#menu").isVisible(), true);
  await page.keyboard.press("Escape");
  assert.equal(await page.locator("#menu").isVisible(), false);
  await ctx.close();
});
await t("barre d’achat mobile : cachée sur le hero, visible ensuite", async () => {
  const ctx = await browser.newContext(iphone); const page = await ctx.newPage();
  await page.goto(BASE + "/");
  assert.equal(await page.locator("[data-sticky]").evaluate((el) => el.classList.contains("is-on")), false);
  await page.mouse.wheel(0, 1800); await page.waitForTimeout(500);
  assert.equal(await page.locator("[data-sticky]").evaluate((el) => el.classList.contains("is-on")), true);
  await ctx.close();
});

if (SHOTS) {
  console.log("Captures");
  const prep = async (page) => page.evaluate(async () => {
    document.querySelectorAll("[data-reveal]").forEach((e) => e.classList.add("is-visible"));
    document.querySelectorAll("img[loading=lazy]").forEach((i) => { i.loading = "eager"; });
    for (let y = 0; y < document.body.scrollHeight; y += innerHeight / 2) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
    scrollTo(0, 0);
    await Promise.all(Array.from(document.images).map((i) => i.complete && i.naturalWidth ? null : new Promise((r) => { i.onload = i.onerror = r; setTimeout(r, 3000); })));
    const s = document.querySelector("[data-sticky]"); if (s) s.style.display = "none";
  });
  for (const [name, opts] of [["mobile", iphone], ["desktop", { ...desktop, deviceScaleFactor: 1 }]]) {
    for (const [slug, path] of [["accueil", "/"], ["produit", "/oreiller-cervical-ajustable"], ["contact", "/contact"]]) {
      const ctx = await browser.newContext({ ...opts, reducedMotion: "reduce" }); const page = await ctx.newPage();
      await page.goto(BASE + path, { waitUntil: "networkidle" });
      await prep(page);
      await page.screenshot({ path: `screenshots/${slug}-${name}-ecran1.png` });
      await page.screenshot({ path: `screenshots/${slug}-${name}.png`, fullPage: true });
      await ctx.close();
    }
    for (const id of ["difference", "forme", "offre"]) {
      const ctx = await browser.newContext({ ...opts, reducedMotion: "reduce" }); const page = await ctx.newPage();
      await page.goto(BASE + "/", { waitUntil: "networkidle" });
      await prep(page);
      await page.evaluate(() => { const h = document.querySelector("[data-header]"); if (h) h.style.position = "static"; });
      await page.locator("#" + id).screenshot({ path: `screenshots/section-${id}-${name}.png` });
      await ctx.close();
    }
  }
  console.log("  → screenshots/");
}

await browser.close();
server.close();
console.log(`\n${passes} réussis, ${failures} en échec`);
process.exit(failures ? 1 : 0);
