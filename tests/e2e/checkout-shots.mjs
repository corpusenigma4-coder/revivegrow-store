/** Captures du tunnel de commande (mobile + ordinateur) avec un SDK PayPal simulé — aucun paiement réel. */
import { chromium, devices } from "playwright";
import { startPagesServer } from "./pages-server.mjs";
const server = await startPagesServer("dist", 4330);
const B = "http://127.0.0.1:4330";
const MOCK = `window.paypal={FUNDING:{PAYPAL:"paypal",CARD:"card"},Buttons(o){return{isEligible(){return true},render(sel){const b=document.createElement("div");b.style.cssText="height:50px;border-radius:999px;display:grid;place-items:center;font:600 15px system-ui;"+(o.fundingSource==="card"?"background:#2c2e2f;color:#fff":"background:#ffc439;color:#003087");b.textContent=o.fundingSource==="card"?"Carte de débit ou de crédit (aperçu)":"PayPal (aperçu)";document.querySelector(sel).appendChild(b);return Promise.resolve()}}}};`;
const browser = await chromium.launch();
for (const [name, opts] of [["mobile", devices["iPhone 13"]], ["desktop", { viewport: { width: 1280, height: 900 } }]]) {
  const ctx = await browser.newContext({ ...opts, locale: "fr-FR", reducedMotion: "reduce" }); const p = await ctx.newPage();
  await p.route("https://www.paypal.com/sdk/**", (r) => r.fulfill({ contentType: "text/javascript", body: MOCK }));
  await p.goto(B + "/");
  await p.screenshot({ path: `screenshots/tunnel-0-accueil-${name}.png` });
  await p.goto(B + "/commande/");
  await p.screenshot({ path: `screenshots/tunnel-1-commande-${name}.png`, fullPage: true });
  await p.click("[data-step='commande'] button");
  await p.fill("#co-email", "marie@example.fr"); await p.fill("#co-name", "Marie Durand"); await p.fill("#co-address1", "12 rue des Lilas"); await p.fill("#co-postal", "69003"); await p.fill("#co-city", "Lyon");
  await p.evaluate(() => scrollTo(0, 0));
  await p.screenshot({ path: `screenshots/tunnel-2-livraison-${name}.png`, fullPage: true });
  await p.click("[data-step='livraison'] button[type=submit]");
  await p.waitForSelector("#pp-card > div"); await p.waitForTimeout(200);
  await p.screenshot({ path: `screenshots/tunnel-3-paiement-${name}.png`, fullPage: true });
  await ctx.close();
}
await browser.close(); server.close();
