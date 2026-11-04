/**
 * Mise à jour de la campagne côté navigateur.
 * - Sans date de fin : aucune horloge, aucun compte à rebours (offre « à durée limitée »).
 * - Avec date de fin : compte à rebours réel, arrêt définitif à l'échéance, jamais de redémarrage.
 */
import { CAMPAIGN } from "../config/campaign";
import { campaignPhase, offerOpen, remainingUntil, phaseMessage, type CampaignPhase } from "../lib/campaign";

const pad = (n: number) => String(n).padStart(2, "0");
const root = document.documentElement;

function label(now: number, endsAt: string): string {
  const r = remainingUntil(now, endsAt);
  if (r.total <= 0) return "Offre terminée";
  if (r.days > 0) return `${r.days} j ${pad(r.hours)} h ${pad(r.minutes)} min`;
  if (r.hours > 0) return `${r.hours} h ${pad(r.minutes)} min`;
  return `${Math.max(1, r.minutes)} min`;
}

let lastPhase: CampaignPhase | null = null;

function apply(phase: CampaignPhase) {
  root.dataset.phase = phase;
  root.dataset.offer = offerOpen(phase) ? "open" : "closed";
  const msg = phaseMessage(phase);
  document.querySelectorAll<HTMLElement>("[data-phase-message]").forEach((el) => {
    const isUrgency = el.dataset.phaseMessage === "urgency";
    const show = Boolean(msg) && !(isUrgency && !offerOpen(phase));
    el.textContent = show ? msg : "";
    el.hidden = !show;
  });
}

function tick() {
  const now = Date.now();
  const phase = campaignPhase(now, CAMPAIGN);
  if (phase !== lastPhase) { apply(phase); lastPhase = phase; }
  const end = CAMPAIGN.endsAt;
  if (!end) return; // pas de date réelle → pas d'horloge
  const text = label(now, end);
  document.querySelectorAll<HTMLElement>("[data-countdown-text]").forEach((el) => { el.textContent = text; });
  document.querySelectorAll<HTMLElement>("[data-countdown]").forEach((el) => { el.hidden = !offerOpen(phase); });
  if (phase === "ended" || phase === "off") return; // arrêt définitif
  window.setTimeout(tick, 1000 * (60 - new Date().getSeconds()) || 60_000);
}

tick();
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && CAMPAIGN.endsAt && lastPhase !== "ended") { lastPhase = null; tick(); }
});
