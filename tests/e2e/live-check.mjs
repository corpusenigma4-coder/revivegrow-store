/**
 * Vérification du site PUBLIÉ (exécutée par GitHub Actions après chaque déploiement,
 * l'environnement de développement n'ayant pas accès à revivegrow.store ni à paypal.com).
 * Contrôle : « Obtenir l’offre », tunnel /commande/, chargement des boutons officiels PayPal,
 * éligibilité réelle de la carte bancaire. Aucune commande n'est créée, aucun paiement initié.
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
  const res = await page.goto(URL + "/", { waitUntil: "domcontentloaded", timeout: 45000 }).catch((e) => ({ status: () => "ERREUR " + e.message }));
  log("Accueil — statut HTTP", res.status());
  if (res.status() !== 200) { ok = false; continue; }
  const cta = page.locator("[data-hero] [data-cta='offre']");
  log("Bouton « Obtenir l’offre »", (await cta.count()) ? `présent → ${await cta.getAttribute("href")}` : "ABSENT");
  await cta.click();
  await page.waitForURL(/\/commande\//, { timeout: 20000 }).catch(() => {});
  log("Tunnel /commande/", page.url());
  const s1 = await page.locator("[data-step='commande']").innerText().catch(() => "");
  log("Récapitulatif 32,40 € + livraison gratuite", /32,40\s?€/.test(s1) && /Gratuite/i.test(s1) ? "oui" : "NON");
  await page.click("[data-step='commande'] button");
  // Données de test : aucune commande n'est créée tant qu'on ne clique pas sur un bouton PayPal.
  await page.fill("#co-email", "verification@example.com"); await page.fill("#co-name", "Test Vérification");
  await page.fill("#co-address1", "1 rue de Test"); await page.fill("#co-postal", "75001"); await page.fill("#co-city", "Paris");
  await page.click("[data-step='livraison'] button[type=submit]");
  const state = await page.waitForFunction(() => document.querySelector("[data-co]")?.dataset.pay || false, null, { timeout: 30000 }).then((h) => h.jsonValue()).catch(() => "délai dépassé");
  log("Boutons PayPal officiels", state === "ready" ? "chargés" : `NON (${state})`);
  if (state !== "ready") ok = false;
  const cardVisible = await page.locator("#pp-card").isVisible().catch(() => false);
  const cardUnavailable = await page.locator("[data-card-unavailable]").isVisible().catch(() => false);
  log("Bouton carte bancaire (PayPal)", cardVisible && !cardUnavailable ? "proposé par PayPal (éligible)" : "non proposé par PayPal");
  log("Total à payer", (await page.locator(".recap__total").innerText().catch(() => "?")).replace(/\s+/g, " "));
  await page.waitForTimeout(2500);
  const tag = label.startsWith("mobile") ? "mobile" : "desktop";
  await page.screenshot({ path: `screenshots/live-paiement-${tag}.png`, fullPage: true });
  await ctx.close();
}
await browser.close();
console.log(ok ? "\nRÉSULTAT : site en ligne et bouton PayPal chargé." : "\nRÉSULTAT : problème détecté (voir ci-dessus).");
process.exit(ok ? 0 : 1);
