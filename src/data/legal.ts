/**
 * Pages d'information et juridiques — BROUILLONS rédigés à partir des conditions
 * commerciales fournies par la marque. Aucune donnée d'entreprise inventée :
 * chaque information manquante est signalée par T("…") et s'affiche « [À compléter : …] ».
 * À faire relire par un professionnel du droit avant d'accepter des commandes.
 */
export type LegalSection = { h: string; html: string };
export type LegalPage = { slug: string; title: string; lead: string; updated: string; sections: LegalSection[] };

const T = (s: string) => `<mark class="todo">[À compléter&nbsp;: ${s}]</mark>`;
const EMAIL = `<a href="mailto:corpusenigma4@gmail.com">corpusenigma4@gmail.com</a>`;
const VENDEUR = `${T("dénomination sociale")}, ${T("forme juridique et capital")}, dont le siège est situé ${T("adresse complète")}, immatriculée sous le numéro ${T("SIREN / RCS ou registre équivalent")}, TVA intracommunautaire ${T("numéro de TVA")}`;
const P = (...l: string[]) => l.map((x) => `<p>${x}</p>`).join("");
const UL = (...l: string[]) => `<ul>${l.map((x) => `<li>${x}</li>`).join("")}</ul>`;
const UPDATED = "Version provisoire — novembre 2026";

export const LEGAL: LegalPage[] = [
  {
    slug: "mentions-legales",
    title: "Mentions légales",
    lead: "Informations sur l’éditeur et l’hébergeur du site revivegrow.store.",
    updated: UPDATED,
    sections: [
      { h: "Éditeur du site", html: P(`Le site revivegrow.store est édité par ${VENDEUR}.`, `Téléphone&nbsp;: ${T("numéro de téléphone")} — E-mail&nbsp;: ${EMAIL}`) },
      { h: "Directeur de la publication", html: P(T("nom et qualité du directeur de la publication")) },
      { h: "Hébergement", html: P("GitHub Pages, service fourni par GitHub, Inc., 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, États-Unis — github.com.", `Téléphone de l’hébergeur&nbsp;: ${T("numéro de téléphone de l’hébergeur")}`) },
      { h: "Propriété intellectuelle", html: P("L’ensemble des contenus du site (textes, photographies, éléments graphiques, logo) est protégé. Toute reproduction ou réutilisation sans autorisation écrite préalable est interdite.") },
      { h: "Contact", html: P(`Pour toute question relative au site&nbsp;: ${EMAIL}.`) },
    ],
  },
  {
    slug: "cgv",
    title: "Conditions générales de vente",
    lead: "Conditions applicables aux commandes passées sur revivegrow.store par des consommateurs.",
    updated: UPDATED,
    sections: [
      { h: "1. Objet et champ d’application", html: P("Les présentes conditions générales de vente (CGV) régissent les ventes conclues à distance sur le site revivegrow.store entre le vendeur et tout consommateur. Elles sont acceptées par le client avant la validation de sa commande. Les CGV applicables sont celles en vigueur à la date de la commande.") },
      { h: "2. Vendeur", html: P(`Les produits sont vendus par ${VENDEUR}. Contact&nbsp;: ${EMAIL}.`) },
      { h: "3. Produits", html: P("Le Pack Sommeil REVIVE GROW comprend un oreiller cervical ergonomique réglable en hauteur. Pendant l’offre spéciale Pré-Black Friday, il est accompagné, sans supplément, d’un masque de sommeil et d’une boîte de bandelettes nasales. Ces deux articles offerts sont indissociables du pack et ne peuvent être achetés ou échangés séparément.", "Les caractéristiques essentielles de chaque article sont présentées sur la fiche produit.") },
      { h: "4. Prix", html: P("Les prix sont indiqués en euros, toutes taxes comprises (TTC). Le prix du Pack Sommeil pendant l’offre spéciale Pré-Black Friday est de 32,40&nbsp;€ TTC pour les trois articles. La livraison est gratuite en France métropolitaine.", "Le prix applicable est celui affiché au moment de la validation de la commande. Le vendeur peut modifier ses prix et ses offres à tout moment&nbsp;; ces modifications ne s’appliquent pas aux commandes déjà validées.") },
      { h: "5. Commande", html: P("Le client clique sur «&nbsp;Obtenir l’offre&nbsp;», vérifie le récapitulatif de sa commande (articles, quantité, prix total, livraison), indique son adresse e-mail et son adresse de livraison, puis choisit son moyen de paiement. Le choix d’un moyen de paiement vaut commande avec obligation de paiement, ce qui est indiqué au client avant ce choix. PayPal adresse au client un reçu de paiement. REVIVE GROW lui adresse ensuite par e-mail une confirmation de commande accompagnée des présentes CGV.", "Le vendeur se réserve le droit de refuser une commande anormale ou passée de mauvaise foi.") },
      { h: "6. Paiement", html: P("Le paiement s’effectue en ligne, au moment de la commande, sur la plateforme sécurisée de PayPal (compte PayPal ou, lorsque PayPal le propose, carte bancaire). L’adresse de livraison saisie par le client est transmise à PayPal avec la commande. Le vendeur n’a jamais accès aux données bancaires du client. La commande n’est définitive qu’après confirmation du paiement par PayPal.") },
      { h: "7. Livraison", html: P("Les commandes sont livrées gratuitement en France métropolitaine, à l’adresse indiquée par le client, dans un délai de 3 à 5 jours ouvrés. Les modalités détaillées figurent dans la <a href=\"/livraison\">politique de livraison</a>.", "Les risques de perte ou d’endommagement des produits sont transférés au client au moment où il prend physiquement possession des produits (article L216-4 du Code de la consommation). En cas de dépassement du délai de livraison, le client peut, après mise en demeure restée sans effet, résoudre le contrat dans les conditions prévues aux articles L216-6 et suivants du Code de la consommation.") },
      { h: "8. Droit de rétractation", html: P("Le client dispose d’un délai de quatorze (14) jours à compter de la réception des produits pour exercer son droit de rétractation, sans avoir à motiver sa décision (articles L221-18 et suivants du Code de la consommation). Les modalités figurent sur la page <a href=\"/retractation\">Droit de rétractation</a>.") },
      { h: "9. Garantie commerciale de 90 jours", html: P("En complément des garanties légales, le vendeur propose une garantie commerciale «&nbsp;satisfait ou remboursé&nbsp;» de 90 jours, dont les conditions sont décrites sur la page <a href=\"/garantie-90-jours\">Garantie 90 jours</a>.") },
      { h: "10. Garanties légales", html: P("Tous les produits bénéficient de la garantie légale de conformité (articles L217-3 et suivants du Code de la consommation) et de la garantie des vices cachés (articles 1641 et suivants du Code civil), présentées sur la page <a href=\"/garanties-legales\">Garanties légales</a>.") },
      { h: "11. Service client et réclamations", html: P(`Pour toute question ou réclamation&nbsp;: ${EMAIL}.`) },
      { h: "12. Médiation de la consommation", html: P(`Conformément à l’article L612-1 du Code de la consommation, le client peut recourir gratuitement à un médiateur de la consommation en vue de la résolution amiable d’un litige, après une réclamation écrite préalable auprès du vendeur&nbsp;: ${T("nom, adresse et site internet du médiateur de la consommation")}.`) },
      { h: "13. Données personnelles", html: P("Les données collectées lors d’une commande sont traitées conformément à la <a href=\"/confidentialite\">politique de confidentialité</a>.") },
      { h: "14. Droit applicable", html: P("Les présentes CGV sont soumises au droit français. En cas de litige, le client peut saisir, à son choix, la juridiction du lieu où il demeurait au moment de la conclusion du contrat ou de la survenance du fait dommageable.") },
    ],
  },
  {
    slug: "livraison",
    title: "Politique de livraison",
    lead: "Livraison gratuite en France métropolitaine, sous 3 à 5 jours ouvrés.",
    updated: UPDATED,
    sections: [
      { h: "Zone de livraison", html: P(`Nous livrons en France métropolitaine. ${T("préciser si la Corse est incluse")}`) },
      { h: "Frais de livraison", html: P("La livraison est gratuite. Aucun frais supplémentaire n’est ajouté au prix affiché.") },
      { h: "Délai", html: P(`Votre commande est livrée sous 3 à 5 jours ouvrés (du lundi au vendredi, hors jours fériés). ${T("point de départ du délai : validation de la commande ou expédition")}`) },
      { h: "Transport et suivi", html: P(`Les trois articles du pack sont expédiés ensemble. Transporteur&nbsp;: ${T("nom du transporteur")}. Un e-mail de suivi vous est envoyé lors de l’expédition.`) },
      { h: "À la réception", html: P("Vérifiez l’état du colis en présence du livreur lorsque c’est possible. En cas de colis endommagé ou de produit manquant, signalez-le-nous dès que possible avec des photos à " + EMAIL + ".") },
      { h: "Retard ou colis non reçu", html: P("Si votre commande n’est pas arrivée dans le délai annoncé, écrivez-nous&nbsp;: nous vérifions immédiatement son acheminement. Vos droits en cas de retard sont rappelés à l’article 7 des <a href=\"/cgv\">CGV</a>.") },
    ],
  },
  {
    slug: "retours",
    title: "Politique de retour",
    lead: "Deux possibilités pour retourner votre commande : le droit de rétractation de 14 jours et notre garantie commerciale de 90 jours.",
    updated: UPDATED,
    sections: [
      { h: "Vos deux options", html: UL("<strong>Droit de rétractation (légal)</strong> : 14 jours à compter de la réception, sans justification. <a href=\"/retractation\">En savoir plus</a>.", "<strong>Garantie satisfait ou remboursé (commerciale)</strong> : 90 jours à compter de la livraison, selon ses conditions. <a href=\"/garantie-90-jours\">En savoir plus</a>.") },
      { h: "Comment faire un retour", html: `<ol><li>Écrivez-nous à ${EMAIL} en indiquant votre numéro de commande.</li><li>Nous vous envoyons les instructions et l’adresse de retour.</li><li>Renvoyez les articles dans les 14 jours suivant votre demande.</li></ol>` + P(`Adresse de retour&nbsp;: ${T("adresse de retour")}`) },
      { h: "Frais de retour", html: P(T("frais de retour à la charge du client ou pris en charge par REVIVE GROW")) },
      { h: "Remboursement", html: P("Le remboursement est effectué avec le même moyen de paiement que celui utilisé lors de la commande, au plus tard 14 jours après la réception de votre demande de rétractation. Nous pouvons différer le remboursement jusqu’à la récupération des articles ou jusqu’à la preuve de leur expédition.") },
      { h: "Articles d’hygiène", html: P(`Pour des raisons d’hygiène, les bandelettes nasales descellées après la livraison peuvent ne pas être reprises (article L221-28, 5° du Code de la consommation). ${T("validation juridique de cette exception")}`) },
    ],
  },
  {
    slug: "garantie-90-jours",
    title: "Garantie satisfait ou remboursé 90 jours",
    lead: "Une garantie commerciale offerte par REVIVE GROW, en plus de vos droits légaux, qu’elle ne remplace pas.",
    updated: UPDATED,
    sections: [
      { h: "Le principe", html: P("Si l’oreiller ne vous convient pas, vous pouvez nous le retourner dans les 90 jours suivant la livraison et être remboursé, dans les conditions ci-dessous.") },
      { h: "Garant", html: P(`La garantie est accordée par ${VENDEUR}. Contact&nbsp;: ${EMAIL}.`) },
      { h: "Durée", html: P("90 jours à compter de la date de livraison de la commande.") },
      { h: "Produits concernés et conditions", html: P(T("produits couverts (oreiller seul ou pack complet), état exigé, présence de l’emballage")) },
      { h: "Mise en œuvre", html: P(`Écrivez-nous à ${EMAIL} avec votre numéro de commande. Nous vous transmettons les instructions de retour. Frais de retour&nbsp;: ${T("à la charge du client ou de REVIVE GROW")}.`) },
      { h: "Remboursement", html: P(`Montant remboursé&nbsp;: ${T("prix payé, totalité ou partie")}. Le remboursement est effectué sur le moyen de paiement utilisé, ${T("délai de remboursement")}.`) },
      { h: "Vos garanties légales restent applicables", html: P("Cette garantie commerciale ne prive pas le consommateur de la garantie légale de conformité (articles L217-3 et suivants du Code de la consommation) ni de la garantie des vices cachés (articles 1641 à 1649 du Code civil), présentées sur la page <a href=\"/garanties-legales\">Garanties légales</a>.", T("mentions complètes exigées par l’article L217-22 du Code de la consommation — à valider juridiquement")) },
    ],
  },
  {
    slug: "garanties-legales",
    title: "Garanties légales",
    lead: "Vos droits en cas de défaut de conformité ou de vice caché.",
    updated: UPDATED,
    sections: [
      { h: "Garantie légale de conformité", html: P("Le consommateur dispose d’un délai de deux ans à compter de la délivrance du bien pour obtenir la mise en œuvre de la garantie légale de conformité en cas d’apparition d’un défaut de conformité. Durant ce délai, le consommateur n’est tenu d’établir que l’existence du défaut de conformité et non la date d’apparition de celui-ci.", "La garantie légale de conformité donne au consommateur droit à la réparation ou au remplacement du bien dans un délai de trente jours suivant sa demande, sans frais et sans inconvénient majeur pour lui. Si le bien est réparé dans le cadre de la garantie légale de conformité, le consommateur bénéficie d’une extension de six mois de la garantie initiale. Si le consommateur demande la réparation du bien, mais que le vendeur impose le remplacement, la garantie légale de conformité est renouvelée pour une période de deux ans à compter de la date de remplacement du bien.", "Le consommateur peut obtenir une réduction du prix d’achat en conservant le bien ou mettre fin au contrat en se faisant rembourser intégralement contre restitution du bien, si&nbsp;: 1° le professionnel refuse de réparer ou de remplacer le bien&nbsp;; 2° la réparation ou le remplacement du bien intervient après un délai de trente jours&nbsp;; 3° la réparation ou le remplacement du bien occasionne un inconvénient majeur pour le consommateur&nbsp;; 4° la non-conformité du bien persiste en dépit de la tentative de mise en conformité du vendeur restée infructueuse.", "Le consommateur a également droit à une réduction du prix du bien ou à la résolution du contrat lorsque le défaut de conformité est si grave qu’il justifie que la réduction du prix ou la résolution du contrat soit immédiate. Le consommateur n’a pas droit à la résolution de la vente si le défaut de conformité est mineur. Toute période d’immobilisation du bien en vue de sa réparation ou de son remplacement suspend la garantie qui restait à courir jusqu’à la délivrance du bien remis en état.", "Les droits mentionnés ci-dessus résultent de l’application des articles L217-1 à L217-32 du Code de la consommation. Le vendeur qui fait obstacle de mauvaise foi à la mise en œuvre de la garantie légale de conformité encourt une amende civile d’un montant maximal de 300&nbsp;000 euros, qui peut être porté jusqu’à 10&nbsp;% du chiffre d’affaires moyen annuel (article L241-5 du Code de la consommation).", T("vérifier la conformité exacte de ce texte avec l’encadré réglementaire du décret n° 2022-946")) },
      { h: "Garantie des vices cachés", html: P("Le consommateur bénéficie également de la garantie légale des vices cachés en application des articles 1641 à 1649 du Code civil, pendant une durée de deux ans à compter de la découverte du défaut. Cette garantie donne droit à une réduction de prix si le bien est conservé ou à un remboursement intégral contre restitution du bien.") },
      { h: "Mise en œuvre", html: P(`Contactez-nous à ${EMAIL} en décrivant le problème, avec votre numéro de commande et, si possible, des photos.`) },
    ],
  },
  {
    slug: "retractation",
    title: "Droit de rétractation",
    lead: "Vous disposez de 14 jours après réception pour vous rétracter, sans avoir à vous justifier.",
    updated: UPDATED,
    sections: [
      { h: "Délai", html: P("Le délai de rétractation expire 14 jours après le jour où vous, ou un tiers que vous avez désigné, prenez physiquement possession des produits.") },
      { h: "Se rétracter du contrat", html: P(`Informez-nous de votre décision par une déclaration dénuée d’ambiguïté, par exemple par e-mail à ${EMAIL}, ou en utilisant le bouton ci-dessous ou le formulaire type. Nous accusons réception de votre rétractation par e-mail.`) + `<p><a class="legal__cta" href="mailto:corpusenigma4@gmail.com?subject=R%C3%A9tractation%20%E2%80%94%20commande%20n%C2%B0%20&body=Je%20vous%20notifie%20par%20la%20pr%C3%A9sente%20ma%20r%C3%A9tractation%20du%20contrat%20portant%20sur%20la%20vente%20du%20bien%20ci-dessous%20%3A%0ANum%C3%A9ro%20de%20commande%20%3A%0ACommand%C3%A9%20le%20%2F%20re%C3%A7u%20le%20%3A%0ANom%20%3A%0AAdresse%20%3A%0ADate%20%3A">Se rétracter du contrat ici</a></p>` + P(T("fonction de rétractation en ligne avec accusé de réception automatique, à brancher avec le système de commandes")) },
      { h: "Retour des produits", html: P("Renvoyez les produits au plus tard 14 jours après nous avoir communiqué votre décision. Les modalités figurent dans la <a href=\"/retours\">politique de retour</a>.") },
      { h: "Remboursement", html: P("Nous vous remboursons la totalité des sommes versées, y compris les frais de livraison initiaux, au plus tard 14 jours à compter du jour où nous sommes informés de votre décision. Le remboursement peut être différé jusqu’à la récupération des produits ou la preuve de leur expédition. Votre responsabilité peut être engagée en cas de dépréciation des produits résultant de manipulations autres que celles nécessaires pour établir leur nature, leurs caractéristiques et leur bon fonctionnement.") },
      { h: "Formulaire type de rétractation", html: `<blockquote>À l’attention de REVIVE GROW, ${T("adresse postale")}, ${EMAIL}&nbsp;:<br>Je vous notifie par la présente ma rétractation du contrat portant sur la vente du bien ci-dessous&nbsp;:<br>Commandé le / reçu le&nbsp;:<br>Nom du consommateur&nbsp;:<br>Adresse du consommateur&nbsp;:<br>Signature du consommateur (uniquement en cas de notification sur papier)&nbsp;:<br>Date&nbsp;:</blockquote>` },
    ],
  },
  {
    slug: "confidentialite",
    title: "Politique de confidentialité",
    lead: "Quelles données nous traitons, pourquoi, et comment exercer vos droits.",
    updated: UPDATED,
    sections: [
      { h: "Responsable du traitement", html: P(`${VENDEUR}. Contact&nbsp;: ${EMAIL}.`) },
      { h: "Données traitées", html: UL("<strong>Lorsque vous nous écrivez</strong> : votre adresse e-mail, votre nom et le contenu de votre message.", "<strong>Lors d’une commande</strong> (dès l’ouverture des ventes) : identité, adresses de livraison et de facturation, e-mail, téléphone, détail de la commande. Les données de paiement sont traitées exclusivement par PayPal.", "<strong>Navigation</strong> : l’hébergeur peut enregistrer des données techniques (adresse IP, navigateur) à des fins de sécurité. Le site n’utilise aucun outil de mesure d’audience ni de publicité.") },
      { h: "Finalités et bases légales", html: UL("Répondre à vos demandes (intérêt légitime).", "Traiter et livrer vos commandes, gérer les retours et garanties (exécution du contrat).", "Respecter nos obligations comptables et fiscales (obligation légale).") },
      { h: "Destinataires", html: P(`GitHub, Inc. (hébergement), PayPal (paiement), Google (messagerie électronique), ${T("transporteur")}. Certains de ces prestataires sont situés aux États-Unis&nbsp;; les transferts sont encadrés par les mécanismes prévus par le RGPD (cadre de protection des données UE–États-Unis ou clauses contractuelles types).`) },
      { h: "Durées de conservation", html: UL("Demandes de contact : 3 ans à compter du dernier échange.", "Données de commande : durée de la relation commerciale, puis 10 ans pour les pièces comptables.") },
      { h: "Vos droits", html: P(`Vous disposez d’un droit d’accès, de rectification, d’effacement, d’opposition, de limitation et de portabilité de vos données, ainsi que du droit de définir des directives relatives à leur sort après votre décès. Pour les exercer&nbsp;: ${EMAIL}. Vous pouvez également introduire une réclamation auprès de la CNIL (www.cnil.fr).`) },
    ],
  },
  {
    slug: "cookies",
    title: "Politique de cookies",
    lead: "Le site revivegrow.store ne dépose aucun cookie publicitaire ni de mesure d’audience.",
    updated: UPDATED,
    sections: [
      { h: "Cookies utilisés", html: P("À ce jour, le site ne dépose aucun cookie et n’utilise aucun traceur nécessitant votre consentement. Les polices de caractères sont hébergées sur le site lui-même&nbsp;: aucune donnée n’est transmise à un service tiers lors de votre visite.") },
      { h: "Paiement", html: P("Lorsque le paiement en ligne sera ouvert, PayPal pourra déposer les cookies strictement nécessaires à la sécurité de la transaction. Ces cookies sont exemptés de consentement.") },
      { h: "Évolution", html: P("Si des outils de mesure d’audience ou de publicité étaient ajoutés, un bandeau vous permettrait de les accepter ou de les refuser aussi facilement, et cette page serait mise à jour.") },
    ],
  },
];
