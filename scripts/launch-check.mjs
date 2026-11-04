/**
 * Contrôle avant lancement : liste tout ce qui empêche une mise en ligne honnête et conforme.
 * `npm run check:launch` → code de sortie 1 tant qu'il reste un point bloquant.
 */
import { CAMPAIGN } from "../src/config/campaign.ts";
import { PILLOW, MASK, STRIPS, SERVICE, SUPPLIER_PROOF } from "../src/config/product.ts";
import { SITE } from "../src/config/site.ts";
import { COMMERCE, CONTACT } from "../src/config/commerce.ts";
import { LEGAL } from "../src/data/legal.ts";

const blockers = [];
const add = (area, msg) => blockers.push(`[${area}] ${msg}`);

if (SITE.preview) add("site", "SITE.preview = true (repères « À confirmer » visibles)");
if (!SITE.indexable) add("site", "SITE.indexable = false (noindex) — à basculer au lancement");
if (!SITE.contact.email) add("site", "E-mail de contact manquant");
for (const p of [PILLOW, MASK, STRIPS]) for (const s of p.specs) if (!s.verified) add("produit", `${p.name} — ${s.label} : « ${s.value} » non vérifié`);
if (!PILLOW.heightsVerified) add("produit", "Hauteurs 8/11/14 cm non confirmées par la fiche fournisseur");
if (!SERVICE.delivery.carrier) add("livraison", "Transporteur non renseigné");
if (!SUPPLIER_PROOF.sourceUrl || !SUPPLIER_PROOF.capturedOn) add("avis", "Source documentée (lien + date de capture) des chiffres fournisseur manquante");
if (CAMPAIGN.enabled && CAMPAIGN.afterCampaign === null) add("campagne", "Offre appliquée après la campagne non définie");
if (!COMMERCE.checkoutEnabled || !COMMERCE.provider) add("paiement", "Paiement non branché (bouton hébergé PayPal ou API de commandes)");
if (!CONTACT.formEndpoint) add("contact", "Formulaire de contact non relié à un service (Formspree) — l’adresse e-mail reste disponible");
for (const pg of LEGAL) for (const s of pg.sections) for (const m of s.missing ?? []) add(`légal:${pg.slug}`, m);

console.log(blockers.length ? `${blockers.length} point(s) bloquant(s) avant lancement :\n` + blockers.map((b) => "  • " + b).join("\n") : "Aucun point bloquant.");
process.exit(blockers.length ? 1 : 0);
