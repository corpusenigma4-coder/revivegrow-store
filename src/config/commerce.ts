/**
 * Paiement, commandes et contact — points de branchement.
 *
 * Le site est STATIQUE (GitHub Pages) : aucun secret ici, aucune capture de paiement
 * dans le navigateur. Tout ce qui est sensible vit chez un service externe.
 * Voir docs/PAIEMENTS-ET-COMMANDES.md pour les deux architectures possibles.
 */
export type CheckoutProvider = "paypal-buttons" | "paypal-hosted-button" | "orders-api";

export const COMMERCE = {
  /** Interrupteur général. Reste à false tant que la validation sandbox n'est pas faite. */
  checkoutEnabled: true,
  /**
   * "paypal-buttons" : boutons officiels PayPal (SDK JS, même client-id public) sur la page /commande/.
   *   L'e-mail et l'adresse saisis dans le tunnel sont transmis à PayPal avec la commande.
   * "paypal-hosted-button" : bouton hébergé de la PR #15 (conservé, réactivable) — il ne permet pas
   *   de transmettre l'e-mail ni l'adresse saisis sur le site.
   */
  provider: "paypal-buttons" as CheckoutProvider | null,

  /** SDK officiel des boutons PayPal (paiement PayPal + carte bancaire si PayPal la propose). */
  paypalButtons: {
    sdkParams: "components=buttons&enable-funding=card&disable-funding=venmo,paylater&currency=EUR&locale=fr_FR&intent=capture",
  },

  /** Option A — bouton hébergé PayPal : prix et livraison définis dans le compte PayPal. */
  paypalHosted: {
    /** Identifiant client PUBLIC du SDK (jamais le secret). */
    clientId: "BAADEUfdEuuHimsc_A7p393C8mMrLLqiuSAoQT_ffCMJ0mfNs_Vn5nXVEExDk-DrZJfJIEhv1BmPniL3Pw" as string | null,
    hostedButtonId: "SZCKF3B62AX6A" as string | null,
  },

  /** Option B — API de commandes externe (fonction serverless) : crée/capture la commande côté serveur. */
  ordersApi: {
    baseUrl: null as string | null, // ex. "https://api.revivegrow.store"
    endpoints: { create: "/orders", capture: "/orders/:id/capture" },
  },

  /** Destinataire des notifications de commande (envoyées par le service externe, pas par le site). */
  orderNotificationEmail: "corpusenigma4@gmail.com",
};

export const CONTACT = {
  email: "corpusenigma4@gmail.com",
  /**
   * Formulaire : service externe compatible site statique (recommandé : Formspree,
   * anti-spam intégré + champ piège). Coller ici l'URL d'envoi du formulaire créé
   * (ex. "https://formspree.io/f/xxxxxxx"). Tant qu'elle est null, le formulaire
   * reste désactivé et l'adresse e-mail est proposée à la place.
   */
  formEndpoint: null as string | null,
  formProvider: "Formspree",
};
