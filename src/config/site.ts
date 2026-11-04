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
  preview: false,
  tagline: "Le calme, pensé dans le détail.",
  description:
    "REVIVE GROW, spécialiste du repos : l’oreiller cervical ergonomique réglable en hauteur, livré en France métropolitaine.",
  contact: {
    email: "corpusenigma4@gmail.com",
    phone: null as string | null,
  },
} as const;

export const NAV = [
  { href: "/#forme", label: "La forme" },
  { href: "/#reglage", label: "Le réglage" },
  { href: "/#offre", label: "L’offre" },
  { href: "/#questions", label: "Questions" },
  { href: "/contact", label: "Contact" },
] as const;

export const LEGAL_NAV = [
  { href: "/livraison", label: "Politique de livraison" },
  { href: "/retours", label: "Politique de retour" },
  { href: "/garantie-90-jours", label: "Garantie 90 jours" },
  { href: "/retractation", label: "Droit de rétractation" },
  { href: "/garanties-legales", label: "Garanties légales" },
  { href: "/cgv", label: "Conditions générales de vente" },
  { href: "/mentions-legales", label: "Mentions légales" },
  { href: "/confidentialite", label: "Confidentialité" },
  { href: "/cookies", label: "Cookies" },
  { href: "/contact", label: "Contact" },
] as const;
