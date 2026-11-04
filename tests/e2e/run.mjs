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
const PAGES = ["/", "/oreiller-cervical-ajustable", "/commande/", "/contact", "/mentions-legales", "/cgv", "/livraison", "/retours", "/garantie-90-jours",
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
    page.on("console", (m) => { if (m.type() === "error" && !(m.location()?.url || "").includes("paypal.com")) errors.push(m.text()); });
    page.on("requestfailed", (r) => { if (!r.url().startsWith("https://www.paypal.com/")) errors.push("échec de chargement : " + r.url()); });
    await page.route("https://www.paypal.com/**", (r) => r.abort());
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
const MOCK_SDK = `
  window.__orders = [];
  window.paypal = { FUNDING: { PAYPAL: "paypal", CARD: "card" }, Buttons(opts) {
    return { isEligible() { return true; }, render(sel) {
      const b = document.createElement("button"); b.type = "button"; b.textContent = "MOCK " + opts.fundingSource; b.dataset.mock = opts.fundingSource;
      b.onclick = async () => {
        const actions = { restart() {}, order: {
          create: (o) => { window.__orders.push(o); return Promise.resolve("ORDER-1"); },
          capture: () => Promise.resolve({ id: "ORDER-1", status: "COMPLETED", purchase_units: [{ payments: { captures: [{ id: "CAP-1", status: "COMPLETED", amount: { currency_code: "EUR", value: "32.40" } }] } }] })
        } };
        const id = await opts.createOrder({}, actions); await opts.onApprove({ orderID: id }, actions);
      };
      document.querySelector(sel).appendChild(b); return Promise.resolve();
    } };
  } };`;

console.log("Tunnel « Obtenir l’offre »");
for (const [label, opts] of [["iPhone SE", { ...devices["iPhone SE"], locale: "fr-FR" }], ["iPhone 13", iphone], ["Android", android], ["ordinateur", desktop]]) {
  await t(`${label} : « Obtenir l’offre » visible dès le premier écran, avec le prix et les cadeaux, et mène à /commande/`, async () => {
    const ctx = await browser.newContext({ ...opts, reducedMotion: "reduce" }); const page = await ctx.newPage();
    await page.goto(BASE + "/");
    const cta = page.locator("[data-hero] [data-cta='offre']");
    assert.equal((await cta.textContent()).trim(), "Obtenir l’offre");
    assert.equal(await cta.getAttribute("href"), "/commande/");
    const box = await cta.boundingBox(); const vh = page.viewportSize().height;
    assert.ok(box && box.y + box.height <= vh, `bouton hors du premier écran (${Math.round(box?.y ?? -1)} / ${vh})`);
    const hero = await page.locator("[data-hero]").innerText();
    assert.match(hero, /32,40 €/); assert.match(hero, /2 cadeaux offerts/i); assert.match(hero, /PayPal/); assert.match(hero, /Carte bancaire/i);
    await ctx.close();
  });
}
await t("aucun libellé « Commander le pack », « Voir le pack », « Découvrir l’offre »", async () => {
  for (const p of ["/", "/oreiller-cervical-ajustable", "/commande/"]) {
    const html = await (await fetch(BASE + p)).text();
    assert.ok(!/Commander le pack|Voir le pack|Découvrir l’offre|Découvrir le pack|Voir l’offre/.test(html), p);
  }
});
await t("tous les boutons d’achat (en-tête, hero, offre, fiche, barre mobile) mènent directement à /commande/", async () => {
  for (const p of ["/", "/oreiller-cervical-ajustable"]) {
    const html = await (await fetch(BASE + p)).text();
    const hrefs = [...html.matchAll(/<a[^>]*data-cta="offre"[^>]*>/g)].map((m) => (m[0].match(/href="([^"]+)"/) || [])[1]);
    assert.ok(hrefs.length >= 2, p); assert.ok(hrefs.every((h) => h === "/commande/"), `${p} : ${hrefs}`);
  }
});
const MOCK_HOSTED = `window.__hosted = [];
  window.paypal = { HostedButtons(o) { window.__hosted.push(o); return { render(sel) { const b = document.createElement("div"); b.dataset.mock = "hosted"; b.textContent = "MOCK hosted"; document.querySelector(sel).appendChild(b); return Promise.resolve(); } }; } };`;
const FULL_MODE = /clientId:\s*"A/.test(readFileSync("src/config/commerce.ts", "utf8").split("paypalButtons")[1] || "");
await t("parcours : « Obtenir l’offre » → Commande → Suivant → Livraison → Suivant → Paiement (bouton hébergé SZCKF3B62AX6A)", async () => {
  const ctx = await browser.newContext({ ...iphone, reducedMotion: "reduce" }); const page = await ctx.newPage();
  const sdk = [];
  await page.route("https://www.paypal.com/sdk/**", (r) => { sdk.push(r.request().url()); r.fulfill({ contentType: "text/javascript", body: FULL_MODE ? MOCK_SDK : MOCK_HOSTED }); });
  await page.goto(BASE + "/");
  await page.locator("[data-hero] [data-cta='offre']").click();
  await page.waitForURL(/\/commande\/$/);
  const s1 = page.locator("[data-step='commande']");
  const t1 = await s1.innerText();
  for (const re of [/Votre commande/, /Pack Sommeil REVIVE GROW/, /Oreiller cervical ergonomique ajustable/, /Masque de sommeil premium/, /Bandelettes nasales premium/, /Offertes/i, /1 pack/, /Gratuite/i, /32,40 €/]) assert.match(t1, re);
  assert.equal(await s1.locator("button").count(), 1);
  assert.equal((await s1.locator("button").textContent()).trim(), "Suivant");
  assert.equal(await page.locator("input[type=tel], [name*=phone], [name*=tel]").count(), 0, "téléphone demandé");
  await s1.locator("button").click();
  if (FULL_MODE) return; // couvert par le test unitaire de la commande
  const sent = [];
  await page.route("https://formsubmit.co/**", (r) => { sent.push(JSON.parse(r.request().postData() || "{}")); r.fulfill({ contentType: "application/json", body: '{"success":"true"}' }); });
  // Étape 2 — livraison
  const s2 = page.locator("[data-step='livraison']");
  await s2.waitFor();
  assert.equal(await page.locator("#co-email").getAttribute("inputmode"), "email");
  await s2.locator("button[type=submit]").click();
  assert.equal(await page.locator("[data-err='email']").isVisible(), true, "validation e-mail");
  await page.fill("#co-email", "marie@example.fr"); await page.fill("#co-name", "Marie Durand");
  await page.fill("#co-address1", "12 rue des Lilas"); await page.fill("#co-postal", "69003"); await page.fill("#co-city", "Lyon");
  await s2.locator("button[type=submit]").click();
  // Étape 3 — paiement
  const s3 = page.locator("[data-step='paiement']");
  await s3.waitFor();
  assert.equal(sent.length, 1, "coordonnées transmises au vendeur");
  assert.equal(sent[0]["E-mail"], "marie@example.fr"); assert.equal(sent[0]["Adresse"], "12 rue des Lilas");
  assert.equal(sent[0]["Code postal"], "69003"); assert.equal(sent[0]["Ville"], "Lyon"); assert.equal(sent[0]["Pays"], "France");
  assert.match(sent[0]["Référence"], /^RG-/);
  const t3 = await s3.innerText();
  assert.match(t3, /Total à payer :\s*32,40 €/);
  assert.match(t3, /12 rue des Lilas, 69003 Lyon, France/);
  assert.match(t3, /Référence de commande : RG-/);
  await page.locator("[data-mock='hosted']").waitFor();
  assert.equal(await page.evaluate(() => window.__hosted[0].hostedButtonId), "SZCKF3B62AX6A");
  assert.match(sdk[0], /client-id=BAADEUfdEuuHimsc_A7p393C8mMrLLqiuSAoQT_ffCMJ0mfNs_Vn5nXVEExDk-DrZJfJIEhv1BmPniL3Pw&components=hosted-buttons&disable-funding=venmo&currency=EUR&locale=fr_FR$/);
  // Aller-retour : pas de second envoi si rien ne change, données conservées
  await s3.locator("button", { hasText: "Retour" }).click();
  await s2.waitFor();
  assert.equal(await page.locator("#co-city").inputValue(), "Lyon");
  await s2.locator("button[type=submit]").click();
  await s3.waitFor();
  assert.equal(sent.length, 1);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(overflow <= 0);
  await ctx.close();
});
await t("paiement indisponible : message clair, aucune fausse confirmation ; pas de barre fixe dans le tunnel", async () => {
  const ctx = await browser.newContext(iphone); const page = await ctx.newPage();
  await page.route("https://www.paypal.com/**", (r) => r.abort());
  await page.goto(BASE + "/commande/");
  assert.equal(await page.locator("[data-sticky], .cbar, .hdr__nav").count(), 0);
  await page.route("https://formsubmit.co/**", (r) => r.abort());
  await page.locator("[data-step='commande'] button").click();
  for (const [id, v] of [["#co-email", "a@b.fr"], ["#co-name", "A B"], ["#co-address1", "1 rue X"], ["#co-postal", "75001"], ["#co-city", "Paris"]]) await page.fill(id, v);
  await page.locator("[data-step='livraison'] button[type=submit]").click();
  await page.locator("[data-step='paiement']").waitFor(); // l'échec d'envoi ne bloque jamais l'achat
  const err = page.locator("[data-pay-error]");
  await err.waitFor({ state: "visible", timeout: 8000 });
  assert.match(await err.textContent(), /n’a pas pu se charger/);
  assert.equal(await page.locator("[data-step='confirmation']").isVisible(), false);
  await ctx.close();
});
await t("le bloc d’achat montre le contenu, le prix et la livraison gratuite avant le paiement", async () => {
  const ctx = await browser.newContext(iphone); const page = await ctx.newPage();
  await page.route("https://www.paypal.com/**", (r) => r.abort());
  await page.goto(BASE + "/oreiller-cervical-ajustable");
  const box = await page.locator("#commander").innerText();
  for (const re of [/Pack Sommeil REVIVE GROW/, /32,40\u00A0€/, /Oreiller cervical ergonomique ajustable/, /Masque de sommeil premium/, /Bandelettes nasales premium/, /OFFERT/i, /Livraison gratuite/i, /3 à 5 jours ouvrés/, /Obtenir l’offre/]) assert.match(box, re);
  const payTop = await page.locator("#paiement").evaluate((el) => el.getBoundingClientRect().top);
  const priceTop = await page.locator("#commander .price").evaluate((el) => el.getBoundingClientRect().top);
  assert.ok(priceTop < payTop, "le prix précède le paiement");
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
    const expect = { 1: [50, 52], 2: [84, 48], 3: [50, 22] };
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
  await page.locator(".ana__pin[data-pt='1']").first().tap();
  await page.waitForTimeout(400);
  assert.equal(await page.locator(".ana__item[data-pt='1']").first().evaluate((el) => el.classList.contains("is-on")), true);
  assert.match(await page.locator("[data-ana-live]").first().textContent(), /Creux central/);
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
      await page.route("https://www.paypal.com/**", (r) => r.abort());
      await page.goto(BASE + path, { waitUntil: "networkidle" });
      await prep(page);
      await page.screenshot({ path: `screenshots/${slug}-${name}-ecran1.png` });
      await page.screenshot({ path: `screenshots/${slug}-${name}.png`, fullPage: true });
      await ctx.close();
    }
    for (const id of ["difference", "forme", "offre"]) {
      const ctx = await browser.newContext({ ...opts, reducedMotion: "reduce" }); const page = await ctx.newPage();
      await page.route("https://www.paypal.com/**", (r) => r.abort());
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
