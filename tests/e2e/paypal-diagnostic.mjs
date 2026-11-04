/**
 * Diagnostic PayPal — exécuté par GitHub Actions (accès réseau à PayPal).
 * Remplit le tunnel avec une adresse de test, clique sur le bouton PayPal puis sur le bouton carte,
 * et enregistre la réponse exacte de PayPal à la CRÉATION de la commande.
 * Aucune approbation, aucun paiement : la fenêtre PayPal est fermée immédiatement.
 */
import { chromium, devices } from "playwright";
import { startPagesServer } from "./pages-server.mjs";

const targets = [];
if (process.env.LIVE_URL !== "0") targets.push(["site publié", process.env.LIVE_URL || "https://revivegrow.store"]);
let server;
if (process.env.LOCAL_DIST === "1") { server = await startPagesServer("dist", 4390); targets.push(["build de la branche", "http://127.0.0.1:4390"]); }

const browser = await chromium.launch();
for (const [label, base] of targets) {
  for (const funding of ["paypal", "card"]) {
    console.log(`\n===== ${label} — bouton ${funding} =====`);
    const ctx = await browser.newContext({ ...devices["Pixel 7"], locale: "fr-FR" });
    const page = await ctx.newPage();
    ctx.on("response", async (r) => {
      const u = r.url();
      if (/paypal\.com\/(v2\/checkout\/orders|smart\/api|graphql)/.test(u) && r.request().method() !== "GET") {
        let body = ""; try { body = (await r.text()).slice(0, 1500); } catch {}
        console.log(`[réseau] ${r.status()} ${r.request().method()} ${u.split("?")[0]}\n         ${body.replace(/\s+/g, " ")}`);
      }
    });
    page.on("console", (m) => { if (m.type() === "error" || /REVIVE GROW/.test(m.text())) console.log(`[console ${m.type()}] ${m.text().slice(0, 1200)}`); });
    page.on("pageerror", (e) => console.log(`[pageerror] ${e.message}`));
    await page.goto(base + "/commande/", { waitUntil: "domcontentloaded" });
    await page.click("[data-step='commande'] button");
    await page.fill("#co-email", "diagnostic@example.com");
    await page.fill("#co-name", "Jean Dupont");
    await page.fill("#co-address1", "10 rue de Rivoli");
    await page.fill("#co-postal", "75001");
    await page.fill("#co-city", "Paris");
    await page.click("[data-step='livraison'] button[type=submit]");
    const st = await page.waitForFunction(() => document.querySelector("[data-co]")?.dataset.pay || false, null, { timeout: 30000 }).then((h) => h.jsonValue()).catch(() => "délai");
    console.log("Boutons :", st);
    if (st !== "ready") { await ctx.close(); continue; }
    const frame = page.frameLocator(`#pp-${funding} iframe`).first();
    const popupP = ctx.waitForEvent("page", { timeout: 15000 }).catch(() => null);
    await frame.locator("[role=link], [role=button], div[data-funding-source]").first().click({ timeout: 15000 }).catch((e) => console.log("clic impossible :", e.message.split("\n")[0]));
    const popup = await popupP;
    if (popup) {
      await popup.waitForLoadState("domcontentloaded").catch(() => {});
      await page.waitForTimeout(6000);
      console.log("Fenêtre PayPal :", popup.url().split("?")[0], "| token présent :", /token=/.test(popup.url()));
      await popup.close().catch(() => {});
    } else {
      await page.waitForTimeout(6000);
    }
    await page.waitForTimeout(2000);
    const err = await page.locator("[data-pay-error]").innerText().catch(() => "");
    console.log("Message affiché :", err.replace(/\s+/g, " ") || "(aucun)");
    await ctx.close();
  }
}
await browser.close(); server?.close();
