/**
 * Structure des pages d'information et juridiques.
 * Phase 1 : plans validés + champs manquants signalés. Aucun texte définitif,
 * aucune donnée d'entreprise inventée. Rédaction finale en phase 4, puis relecture juridique.
 */
export type LegalSection = { h: string; p?: string; missing?: string[] };
export type LegalPage = { slug: string; title: string; lead: string; basis?: string; sections: LegalSection[] };

export const LEGAL: LegalPage[] = [
  {
    slug: "mentions-legales",
    title: "Mentions légales",
    lead: "Informations sur l’éditeur et l’hébergeur du site.",
    basis: "Loi n° 2004-575 du 21 juin 2004 (LCEN), article 6.",
    sections: [
      { h: "Éditeur du site", missing: ["Dénomination sociale et forme juridique", "Capital social", "Adresse du siège", "Numéro d’immatriculation (RCS / SIREN ou registre étranger)", "Numéro de TVA intracommunautaire", "E-mail et téléphone"] },
      { h: "Directeur de la publication", missing: ["Nom du directeur de la publication"] },
      { h: "Hébergement", p: "Hébergeur retenu en phase 3 (proposition : Cloudflare Pages).", missing: ["Raison sociale, adresse et téléphone de l’hébergeur définitif"] },
      { h: "Propriété intellectuelle", p: "Textes, photographies et éléments graphiques du site." },
    ],
  },
  {
    slug: "cgv",
    title: "Conditions générales de vente",
    lead: "Les conditions applicables à toute commande passée sur revivegrow.store.",
    basis: "Code de la consommation, articles L111-1, L221-5 et suivants.",
    sections: [
      { h: "Vendeur et champ d’application", missing: ["Identité complète du vendeur"] },
      { h: "Produits et pack", p: "Le Pack Sommeil comprend l’oreiller cervical, le masque de sommeil et les bandelettes nasales ; les deux accessoires sont offerts et indissociables de l’offre." },
      { h: "Prix", p: "Prix en euros, toutes taxes comprises.", missing: ["Frais de livraison éventuels"] },
      { h: "Commande et paiement", p: "Validation avec mention « commande avec obligation de paiement », paiement PayPal ou carte bancaire via PayPal." },
      { h: "Livraison", p: "France métropolitaine, sous 3 à 5 jours ouvrés.", missing: ["Transporteur", "Zones exclues éventuelles"] },
      { h: "Droit de rétractation", p: "14 jours, formulaire type et fonction de rétractation en ligne." },
      { h: "Garanties légales et garantie commerciale", p: "Garantie légale de conformité, garantie des vices cachés, et garantie commerciale de 90 jours." },
      { h: "Médiation de la consommation", missing: ["Médiateur de la consommation désigné et ses coordonnées"] },
      { h: "Données personnelles et droit applicable" },
    ],
  },
  {
    slug: "livraison-retours",
    title: "Livraison et retours",
    lead: "Délais, zones desservies et modalités de retour.",
    sections: [
      { h: "Délais", p: "Livraison sous 3 à 5 jours ouvrés en France métropolitaine, à compter de l’expédition.", missing: ["Délai de préparation avant expédition"] },
      { h: "Frais de livraison", missing: ["Montant ou gratuité (à confirmer par la marque)"] },
      { h: "Suivi", missing: ["Transporteur et modalités de suivi"] },
      { h: "Retours", p: "Comment retourner un article dans le cadre de la rétractation ou de la garantie de 90 jours.", missing: ["Adresse de retour", "Prise en charge des frais de retour"] },
    ],
  },
  {
    slug: "garantie-90-jours",
    title: "Garantie satisfait ou remboursé 90 jours",
    lead: "Une garantie commerciale offerte par REVIVE GROW, en plus de vos droits légaux.",
    basis: "Code de la consommation, article L217-21 (garantie commerciale).",
    sections: [
      { h: "Ce que couvre la garantie", missing: ["Conditions exactes : état du produit, articles concernés (oreiller seul ou pack)"] },
      { h: "Durée et point de départ", p: "90 jours à compter de la livraison." },
      { h: "Comment l’activer", missing: ["Procédure, contact et adresse de retour"] },
      { h: "Remboursement", missing: ["Délai et moyen de remboursement", "Frais de retour"] },
      { h: "Vos droits légaux restent intacts", p: "Cette garantie ne remplace ni le droit de rétractation de 14 jours ni la garantie légale de conformité de 2 ans." },
    ],
  },
  {
    slug: "garanties-legales",
    title: "Garanties légales",
    lead: "Vos droits en cas de défaut de conformité ou de vice caché.",
    basis: "Code de la consommation, articles L217-3 et suivants ; Code civil, articles 1641 et suivants ; décret n° 2022-946.",
    sections: [
      { h: "Garantie légale de conformité", p: "2 ans à compter de la délivrance du bien. Encadré d’information réglementaire à reproduire intégralement." },
      { h: "Garantie des vices cachés", p: "Articles 1641 à 1649 du Code civil." },
      { h: "Mise en œuvre", missing: ["Coordonnées du service client"] },
    ],
  },
  {
    slug: "retractation",
    title: "Droit de rétractation",
    lead: "Vous disposez de 14 jours pour vous rétracter, sans avoir à vous justifier.",
    basis: "Code de la consommation, articles L221-18 et suivants ; directive (UE) 2023/2673 (fonction de rétractation en ligne).",
    sections: [
      { h: "Délai", p: "14 jours à compter de la réception du bien." },
      { h: "Se rétracter en ligne", p: "Formulaire en ligne « Se rétracter du contrat ici », avec accusé de réception immédiat par e-mail (activé en phase 3)." },
      { h: "Formulaire type", p: "Modèle de formulaire de rétractation (annexe à l’article R221-1) téléchargeable." },
      { h: "Exceptions", missing: ["Validation juridique : articles descellés pour des raisons d’hygiène (bandelettes, masque)"] },
      { h: "Remboursement", p: "Au plus tard 14 jours après la rétractation, frais de livraison initiaux inclus (livraison standard)." },
    ],
  },
  {
    slug: "confidentialite",
    title: "Politique de confidentialité",
    lead: "Quelles données nous traitons, pourquoi et comment exercer vos droits.",
    basis: "Règlement (UE) 2016/679 (RGPD) et loi Informatique et Libertés.",
    sections: [
      { h: "Responsable du traitement", missing: ["Identité et coordonnées du responsable"] },
      { h: "Données et finalités", p: "Commande, livraison, paiement, service client, obligations comptables." },
      { h: "Destinataires", p: "PayPal (paiement), hébergeur, prestataire d’e-mails transactionnels, transporteur." },
      { h: "Durées de conservation" },
      { h: "Vos droits", p: "Accès, rectification, effacement, opposition, limitation, portabilité ; réclamation auprès de la CNIL." },
    ],
  },
  {
    slug: "cookies",
    title: "Politique de cookies",
    lead: "Le site n’utilise aucun traceur publicitaire à ce stade.",
    sections: [
      { h: "Traceurs utilisés", p: "Uniquement les éléments strictement nécessaires (panier, sécurité du paiement). Mesure d’audience en configuration exemptée de consentement (CNIL), si retenue." },
      { h: "Publicité", missing: ["Décision de la marque : campagnes Meta / TikTok (nécessiterait un bandeau de consentement)"] },
    ],
  },
  {
    slug: "contact",
    title: "Contact",
    lead: "Une question sur votre commande ou sur nos produits ? Écrivez-nous.",
    sections: [
      { h: "Service client", missing: ["Adresse e-mail de contact", "Téléphone (facultatif)", "Horaires et délai de réponse"] },
      { h: "Formulaire de contact", p: "Formulaire protégé contre le spam, activé en phase 3." },
    ],
  },
];
