/**
 * Données produit. Chaque valeur provenant d'une spécification de conception
 * (et non encore d'une fiche fournisseur) porte `verified: false`.
 * Le script `npm run check:launch` refuse le lancement tant qu'il en reste.
 */
export type Spec = { label: string; value: string; verified: boolean; note?: string };

export const PILLOW = {
  sku: "RG-OREILLER-CERVICAL",
  name: "Oreiller Cervical Ergonomique Ajustable",
  shortName: "L’oreiller cervical",
  heights: [
    { cm: 8, layers: 0, label: "Basse", detail: "Noyau seul" },
    { cm: 11, layers: 1, label: "Moyenne", detail: "Noyau + 1 insert" },
    { cm: 14, layers: 2, label: "Haute", detail: "Noyau + 2 inserts" },
  ],
  heightsVerified: false,
  /**
   * Anatomie (section « La forme »). `x`/`y` = position du repère en % de la photo vue de dessus.
   * `x: null` → le point n'est pas visible de dessus : il est montré sur une photo de détail.
   */
  anatomy: [
    { n: 1, title: "Soutien cervical avant", text: "Un bord relevé qui accompagne la nuque, visible de profil.", x: null, y: null, detail: "profil" },
    { n: 2, title: "Zone centrale abaissée", text: "Le creux où la tête vient se poser.", x: 50, y: 50, detail: null },
    { n: 3, title: "Côté gauche", text: "Un appui large pour dormir sur le côté.", x: 15.5, y: 48, detail: null },
    { n: 4, title: "Côté droit", text: "La même largeur, pour changer de côté pendant la nuit.", x: 84.5, y: 48, detail: null },
    { n: 5, title: "Housse zippée", text: "La fermeture donne accès aux inserts de réglage.", x: null, y: null, detail: "fermeture" },
  ],
  specs: [
    { label: "Garnissage", value: "Mousse viscoélastique (mémoire de forme)", verified: false },
    { label: "Hauteurs", value: "8 cm · 11 cm · 14 cm", verified: false, note: "Spécification de conception à confronter à la fiche fournisseur. La photo fournie montre 3 couches." },
    { label: "Réglage", value: "Noyau de 8 cm + 2 inserts de 3 cm", verified: false },
    { label: "Housse", value: "Textile, avec fermeture à glissière", verified: false },
    { label: "Dimensions", value: "À compléter", verified: false },
    { label: "Entretien", value: "À compléter", verified: false },
    { label: "Origine", value: "À compléter", verified: false },
  ] satisfies Spec[],
} as const;

export const MASK = {
  sku: "RG-MASQUE",
  name: "Masque de Sommeil Ergonomique",
  color: "Graphite",
  points: [
    "Cavités pour les yeux, sans pression sur les paupières",
    "Bande élastique réglable",
    "Matière douce, finition minimaliste",
    "Conçu pour bloquer la lumière ambiante",
  ],
  specs: [
    { label: "Profondeur des cavités", value: "11 mm", verified: false },
    { label: "Matière", value: "À compléter", verified: false },
  ] satisfies Spec[],
} as const;

export const STRIPS = {
  sku: "RG-BANDELETTES",
  name: "Bandelettes Nasales Premium",
  /** L'emballage photographié indique « Bandes Nasales » : nom à harmoniser. */
  points: [
    "Se posent à l’extérieur du nez",
    "Écartent mécaniquement les ailes du nez",
    "Teinte beige discrète, forme anatomique",
  ],
  specs: [
    { label: "Quantité par boîte", value: "30 bandelettes", verified: false },
    { label: "Composition", value: "À compléter", verified: false },
  ] satisfies Spec[],
} as const;

export const PACK = {
  sku: "RG-PACK-SOMMEIL",
  name: "Pack Sommeil REVIVE GROW",
  items: [
    { key: "pillow", name: PILLOW.name, qty: 1, gift: false },
    { key: "mask", name: MASK.name, qty: 1, gift: true },
    { key: "strips", name: STRIPS.name, qty: 1, gift: true },
  ],
} as const;

export const SERVICE = {
  delivery: {
    free: true,
    cost: 0,
    label: "Livraison offerte",
    delay: "sous 3 à 5 jours ouvrés",
    zone: "France métropolitaine",
    carrier: null as string | null,
  },
  returns: { days: 90 },
} as const;

/**
 * Preuve sociale communiquée par le fournisseur (page produit d'origine).
 * Ce ne sont PAS des avis de clients REVIVE GROW.
 */
export const SUPPLIER_PROOF = {
  rating: 4.9,
  scale: 5,
  customers: "plus de 3 000",
  sourceLabel: "Page produit d’origine du fabricant",
  sourceUrl: null as string | null,
  capturedOn: null as string | null,
} as const;
