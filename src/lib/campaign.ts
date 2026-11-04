/**
 * Logique de campagne, pure et sans dépendance : utilisée au build (rendu initial)
 * et dans le navigateur (mise à jour en temps réel). Testée dans tests/unit.
 */
export type CampaignPhase = "upcoming" | "active" | "last-days" | "last-day" | "ended";

export interface CampaignWindow {
  startsAt: string;
  endsAt: string;
  lastDaysThresholdHours: number;
}

const HOUR = 3_600_000;

export function campaignPhase(now: number | Date, c: CampaignWindow): CampaignPhase {
  const t = typeof now === "number" ? now : now.getTime();
  const start = Date.parse(c.startsAt);
  const end = Date.parse(c.endsAt);
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) throw new Error("Fenêtre de campagne invalide");
  if (t < start) return "upcoming";
  if (t > end) return "ended";
  const left = end - t;
  if (left <= 24 * HOUR) return "last-day";
  if (left <= c.lastDaysThresholdHours * HOUR) return "last-days";
  return "active";
}

export interface Remaining { total: number; days: number; hours: number; minutes: number; seconds: number }

/** Temps restant jusqu'à `endsAt`, jamais négatif (le compteur s'arrête à zéro). */
export function remainingUntil(now: number | Date, endsAt: string): Remaining {
  const t = typeof now === "number" ? now : now.getTime();
  const total = Math.max(0, Date.parse(endsAt) - t);
  const s = Math.floor(total / 1000);
  return {
    total,
    days: Math.floor(s / 86_400),
    hours: Math.floor((s % 86_400) / 3_600),
    minutes: Math.floor((s % 3_600) / 60),
    seconds: s % 60,
  };
}

/** Message d'urgence sobre, uniquement fondé sur la date réelle. */
export function phaseMessage(phase: CampaignPhase): string | null {
  switch (phase) {
    case "last-day": return "Dernier jour pour profiter de l’offre";
    case "last-days": return "Derniers jours pour profiter de l’offre";
    case "ended": return "L’offre Pré-Black Friday est terminée";
    case "upcoming": return "L’offre Pré-Black Friday commence bientôt";
    default: return null;
  }
}
