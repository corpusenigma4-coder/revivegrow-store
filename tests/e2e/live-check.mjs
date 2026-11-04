/**
 * Vérification du site PUBLIÉ (exécutée par GitHub Actions après chaque déploiement,
 * l'environnement de développement n'ayant pas accès à revivegrow.store ni à paypal.com).
 * Contrôle : disponibilité, prix affiché, chargement du bouton hébergé PayPal officiel,
 * options de paiement réellement proposées dans le bouton. Aucun paiement n'est initié.
 */
import { chromium, devices } from "playwright";
const URL = process.env.LIVE_URL || "https://revivegrow.store";
let ok = true;
const log = (k, v) => console.log(`${k.padEnd(34)} ${v}`);
const browser = await chromium.launch();
for (const [label, ctxOpts] of [["mobile (iPhone 13)", devices["iPhone 13"]], ["ordinateur", { viewport: { width: 1440, height: 900 } }]]) {
  console.log(`\n== ${label} ==`);
  const ctx = await browser.newContext({ ...ctxOpts, locale: "fr-FR" });
  const page = await ctx.newPage();
  const res = await page.goto(URL + "/oreiller-cervical-ajustable", { waitUntil: "domcontentloaded", timeout: 45000 }).catch((e) => ({ status: () => "ERREUR " + e.message }));
  log("Statut HTTP", res.status());
  if (res.status() !== 200) { ok = false; continue; }
  log("Titre", await page.title());
  const box = await page.locator("#commander").innerText().catch(() => "");
  log("Prix 32,40 € dans le bloc d’achat", /32,40\s?€/.test(box) ? "oui" : "NON");
  log("Livraison gratuite affichée", /Livraison gratuite/i.test(box) ? "oui" : "NON");
  const state = await page.waitForFunction(() => {
    const r = document.querySelector("#commander [data-pp]"); return r && (r.dataset.state === "ready" || r.dataset.state === "error") ? r.dataset.state : false;
  }, null, { timeout: 30000 }).then((h) => h.jsonValue()).catch(() => "délai dépassé");
  log("Bouton PayPal hébergé", state === "ready" ? "chargé" : `NON (${state})`);
  if (state !== "ready") ok = false;
  await page.waitForTimeout(3000);
  const frames = page.frames().filter((f) => /paypal\.com/.test(f.url()));
  log("Iframes PayPal", frames.length);
  let texts = "";
  for (const f of frames) texts += " " + (await f.locator("body").innerText({ timeout: 5000 }).catch(() => ""));
  texts = texts.replace(/\s+/g, " ").trim();
  log("Texte visible dans le bouton", texts.slice(0, 300) || "(vide)");
  const card = /carte|débit|crédit|card|debit|credit/i.test(texts);
  log("Option carte bancaire proposée", card ? "oui (visible dans le bouton PayPal)" : "non détectée");
  const amount = /32[,.]40/.test(texts);
  log("Montant visible dans le bouton", amount ? "32,40 €" : "non affiché par le bouton (défini côté PayPal)");
  await page.screenshot({ path: `screenshots/live-${label.startsWith("mobile") ? "mobile" : "desktop"}.png`, fullPage: false });
  await page.locator("#paiement").screenshot({ path: `screenshots/live-paiement-${label.startsWith("mobile") ? "mobile" : "desktop"}.png` }).catch(() => {});
  await ctx.close();
}
await browser.close();
console.log(ok ? "\nRÉSULTAT : site en ligne et bouton PayPal chargé." : "\nRÉSULTAT : problème détecté (voir ci-dessus).");
process.exit(ok ? 0 : 1);
