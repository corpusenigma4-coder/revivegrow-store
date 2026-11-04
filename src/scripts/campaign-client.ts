/**
 * Mise à jour en temps réel de la campagne, côté navigateur.
 * - Phase calculée depuis l'horloge réelle et la date de fin absolue (heure de Paris) ;
 * - le compte à rebours s'arrête à zéro, l'offre passe en « terminée », rien ne redémarre.
 */
import { CAMPAIGN } from "../config/campaign";
import { campaignPhase, remainingUntil, phaseMessage, type CampaignPhase } from "../lib/campaign";

const pad = (n: number) => String(n).padStart(2, "0");

function label(now: number): string {
  const r = remainingUntil(now, CAMPAIGN.endsAt);
  if (r.total <= 0) return "Offre terminée";
  if (r.days > 0) return `${r.days} j ${pad(r.hours)} h ${pad(r.minutes)} min`;
  if (r.hours > 0) return `${r.hours} h ${pad(r.minutes)} min`;
  return `${Math.max(1, r.minutes)} min`;
}

let lastPhase: CampaignPhase | null = null;

function tick() {
  const now = Date.now();
  const phase = campaignPhase(now, CAMPAIGN);
  const root = document.documentElement;
  if (phase !== lastPhase) {
    root.dataset.phase = phase;
    const msg = phaseMessage(phase);
    document.querySelectorAll<HTMLElement>("[data-phase-message]").forEach((el) => {
      el.textContent = msg ?? "";
      el.hidden = !msg || (phase === "ended" && el.dataset.phaseMessage === "urgency");
    });
    document.querySelectorAll<HTMLButtonElement>("[data-offer-action]").forEach((b) => {
      if (phase === "ended" || phase === "upcoming") { b.setAttribute("aria-disabled", "true"); b.dataset.blocked = "campaign"; }
    });
    lastPhase = phase;
  }
  const text = label(now);
  document.querySelectorAll<HTMLElement>("[data-countdown-text]").forEach((el) => { el.textContent = text; });
  document.querySelectorAll<HTMLElement>("[data-countdown]").forEach((el) => { el.hidden = phase === "ended" || phase === "upcoming"; });
  if (phase === "ended") return; // arrêt définitif : plus aucune mise à jour
  window.setTimeout(tick, 1000 * (60 - new Date().getSeconds()) || 60_000);
}

tick();
document.addEventListener("visibilitychange", () => { if (!document.hidden && lastPhase !== "ended") { lastPhase = null; tick(); } });
