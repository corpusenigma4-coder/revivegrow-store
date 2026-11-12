/**
 * Données produit. Chaque valeur provenant d'une spécification de conception
 * (et non encore d'une fiche fournisseur) porte `verified: false`.
 * Le script `npm run check:launch` refuse le lancement tant qu'il en reste.
 */
export type Spec = { label: string; value: string; verified: boolean; note?: string };

export const PILLOW = {
  sku: "RG-OREILLER-CERVICAL",
  name: "Oreiller cervical ergonomique ajustable",
  shortName: "L’oreiller cervical",
  heights: [
    { cm: 8, layers: 0, label: "Basse", detail: "Noyau seul" },
    { cm: 11, layers: 1, label: "Moyenne", detail: "Noyau + 1 insert" },
    { cm: 14, layers: 2, label: "Haute", detail: "Noyau + 2 inserts" },
  ],
  heightsVerified: true,
  /**
   * Anatomie (section « La forme »). `x`/`y` = position du repère en % de la photo vue de dessus.
   * `x: null` → le point n'est pas visible de dessus : il est montré sur une photo de détail.
   */
  anatomy: [
    { n: 1, title: "Creux central", text: "La zone abaissée où la tête vient se poser.", x: 50, y: 52, detail: null },
    { n: 2, title: "Côtés larges", text: "Deux appuis amples, à gauche et à droite, pour dormir sur le côté.", x: 84, y: 48, detail: null },
    { n: 3, title: "Contours anatomiques", text: "Des bords incurvés qui suivent la forme des épaules.", x: 50, y: 22, detail: null },
    { n: 4, title: "Soutien cervical avant", text: "Un bord relevé qui accompagne la nuque, visible de profil.", x: null, y: null, detail: "profil" },
    { n: 5, title: "Housse zippée", text: "La fermeture donne accès aux inserts de réglage de la hauteur.", x: null, y: null, detail: "fermeture" },
  ],
  specs: [
    { label: "Garnissage", value: "Mousse à mémoire de forme", verified: true },
    { label: "Hauteurs", value: "8 cm · 11 cm · 14 cm", verified: true },
    { label: "Réglage", value: "Noyau de 8 cm + 2 inserts amovibles de 3 cm", verified: true },
    { label: "Housse", value: "Jacquard respirante, amovible, fermeture éclair", verified: true },
    { label: "Entretien", value: "Housse lavable en machine", verified: true },
    { label: "Dimensions", value: "À compléter", verified: false },
  ] satisfies Spec[],
} as const;

export const MASK = {
  sku: "RG-MASQUE",
  name: "Masque de sommeil premium",
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
  name: "Bandelettes nasales premium",
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
    label: "Livraison gratuite",
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
