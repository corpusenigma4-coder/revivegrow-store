/**
 * Campagne Pré-Black Friday REVIVE GROW.
 * Dates réelles fournies par la marque, exprimées en heure de Paris
 * (novembre = heure d'hiver, UTC+01:00).
 *
 * Règles :
 *  - le compte à rebours se base uniquement sur `endsAt` ; il ne se réinitialise jamais ;
 *  - à l'échéance, l'offre passe à l'état « terminée » et le pack n'est plus proposé à 32,40 € ;
 *  - aucun pourcentage ni prix barré tant que `referencePrice.evidence` est vide
 *    (art. L112-1-1 du Code de la consommation : prix le plus bas des 30 jours précédents).
 */
export const CAMPAIGN = {
  id: "pre-black-friday-2026",
  name: "Offre Pré-Black Friday",
  startsAt: "2026-11-04T00:00:00+01:00",
  endsAt: "2026-11-11T23:59:59+01:00",
  timeZone: "Europe/Paris",
  /** Seuil du message « Derniers jours » (en heures avant la fin). */
  lastDaysThresholdHours: 48,
  price: 32.4,
  currency: "EUR",
  referencePrice: {
    amount: 54.0,
    /** Justificatif du prix antérieur. Tant qu'il est null : ni « -40 % » ni prix barré. */
    evidence: null as string | null,
  },
  /** Offre appliquée après la campagne : à décider par la marque. */
  afterCampaign: null as null | { price: number; label: string },
} as const;
