/**
 * Campagne « Offre spéciale Pré-Black Friday ».
 *
 * Pilotage (sans toucher au reste du code) :
 *  - `enabled: false`          → l'offre disparaît du site (bandeau, prix promo, bloc d'achat fermé) ;
 *  - `endsAt: null`            → offre active en continu, SANS date ni compte à rebours (réglage actuel) ;
 *  - `endsAt: "2026-11-27T23:59:59+01:00"` → date de fin affichée + compte à rebours réel (heure de Paris),
 *                                arrêt automatique et définitif à l'échéance.
 *
 * Règles :
 *  - aucune date ni compte à rebours inventés ;
 *  - aucun pourcentage ni prix barré tant que `referencePrice.evidence` est vide
 *    (art. L112-1-1 du Code de la consommation : prix le plus bas des 30 jours précédents) ;
 *  - aucune mention de stock restant.
 */
export const CAMPAIGN = {
  enabled: true,
  id: "pre-black-friday-2026",
  name: "Offre spéciale Pré-Black Friday",
  shortName: "Pré-Black Friday",
  startsAt: null as string | null,
  endsAt: null as string | null,
  timeZone: "Europe/Paris",
  /** Seuil du message « Derniers jours » (en heures avant la fin), si une date de fin existe. */
  lastDaysThresholdHours: 48,
  price: 32.4,
  currency: "EUR",
  referencePrice: {
    amount: 54.0,
    /** Justificatif du prix antérieur. Tant qu'il est null : ni « −40 % » ni prix barré. */
    evidence: null as string | null,
  },
  /** Offre appliquée après la campagne : à décider par la marque. */
  afterCampaign: null as null | { price: number; label: string },
};
