/**
 * Paramètres généraux du site.
 * `indexable` reste à false tant que le lancement n'est pas validé :
 * toutes les pages portent alors `noindex, nofollow`.
 */
export const SITE = {
  name: "REVIVE GROW",
  url: "https://revivegrow.store",
  locale: "fr-FR",
  indexable: false,
  /** Aperçu de développement : affiche les repères « à confirmer ». */
  preview: true,
  tagline: "Le calme, pensé dans le détail.",
  description:
    "REVIVE GROW, spécialiste du repos : l’oreiller cervical ergonomique réglable en hauteur, livré en France métropolitaine.",
  /** Coordonnées : à fournir (aucune donnée inventée). */
  contact: {
    email: null as string | null,
    phone: null as string | null,
  },
} as const;

export const NAV = [
  { href: "/oreiller-cervical-ajustable", label: "L’oreiller" },
  { href: "/#reglage", label: "Réglage" },
  { href: "/#pack", label: "Le pack" },
  { href: "/#questions", label: "Questions" },
] as const;

export const LEGAL_NAV = [
  { href: "/livraison-retours", label: "Livraison et retours" },
  { href: "/garantie-90-jours", label: "Garantie 90 jours" },
  { href: "/garanties-legales", label: "Garanties légales" },
  { href: "/retractation", label: "Droit de rétractation" },
  { href: "/cgv", label: "Conditions générales de vente" },
  { href: "/mentions-legales", label: "Mentions légales" },
  { href: "/confidentialite", label: "Confidentialité" },
  { href: "/cookies", label: "Cookies" },
  { href: "/contact", label: "Contact" },
] as const;
