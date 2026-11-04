/**
 * Construction de la commande transmise à PayPal (Orders v2, via le SDK officiel).
 * Pure et testée : ce que le client saisit (e-mail, adresse) part réellement dans la commande
 * PayPal — l'adresse est imposée à PayPal (SET_PROVIDED_ADDRESS), l'e-mail est prérempli
 * et recopié dans custom_id pour apparaître dans le détail de la transaction du vendeur.
 */
export interface Customer {
  email: string;
  fullName: string;
  address1: string;
  address2?: string;
  city: string;
  postalCode: string;
  country: string; // ISO 3166-1 alpha-2
}

export interface OrderConfig {
  price: number;        // prix unitaire TTC du pack
  currency: string;     // "EUR"
  shipping: number;     // 0 = livraison gratuite
  quantity: 1;          // quantité fixe : pas de sélecteur
  itemName: string;
  itemDescription: string;
  brandName: string;
}

const money = (n: number) => n.toFixed(2);
const clip = (s: string, n: number) => s.trim().slice(0, n);

export function orderReference(now = Date.now(), rand = Math.random()): string {
  return `RG-${now.toString(36).toUpperCase()}-${Math.floor(rand * 46656).toString(36).toUpperCase().padStart(3, "0")}`;
}

export function orderTotal(c: Pick<OrderConfig, "price" | "quantity" | "shipping">): number {
  return Math.round((c.price * c.quantity + c.shipping) * 100) / 100;
}

export function buildPayPalOrder(customer: Customer, cfg: OrderConfig, reference: string) {
  const itemTotal = cfg.price * cfg.quantity;
  return {
    intent: "CAPTURE",
    payer: { email_address: clip(customer.email, 254) },
    purchase_units: [{
      reference_id: "pack-sommeil",
      invoice_id: reference,
      custom_id: clip(customer.email, 127),
      description: clip(`${cfg.itemName} — ${cfg.itemDescription}`, 127),
      amount: {
        currency_code: cfg.currency,
        value: money(orderTotal(cfg)),
        breakdown: {
          item_total: { currency_code: cfg.currency, value: money(itemTotal) },
          shipping: { currency_code: cfg.currency, value: money(cfg.shipping) },
        },
      },
      items: [{
        name: clip(cfg.itemName, 127),
        description: clip(cfg.itemDescription, 127),
        quantity: String(cfg.quantity),
        unit_amount: { currency_code: cfg.currency, value: money(cfg.price) },
        category: "PHYSICAL_GOODS",
      }],
      shipping: {
        name: { full_name: clip(customer.fullName, 300) },
        address: {
          address_line_1: clip(customer.address1, 300),
          ...(customer.address2 && customer.address2.trim() ? { address_line_2: clip(customer.address2, 300) } : {}),
          admin_area_2: clip(customer.city, 120),
          postal_code: clip(customer.postalCode, 60),
          country_code: customer.country.toUpperCase(),
        },
      },
    }],
    application_context: {
      brand_name: cfg.brandName,
      locale: "fr-FR",
      shipping_preference: "SET_PROVIDED_ADDRESS",
      user_action: "PAY_NOW",
    },
  };
}

/** Champs obligatoires manquants ou invalides (validation volontairement souple). */
export function missingFields(c: Partial<Customer>): (keyof Customer)[] {
  const out: (keyof Customer)[] = [];
  if (!c.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email.trim())) out.push("email");
  for (const k of ["fullName", "address1", "city", "postalCode", "country"] as const) if (!c[k] || !String(c[k]).trim()) out.push(k);
  return out;
}

/** Une capture n'est confirmée au client que si PayPal la déclare COMPLETED, au bon montant. */
export function captureConfirmed(details: any, cfg: Pick<OrderConfig, "price" | "quantity" | "shipping" | "currency">): "ok" | "pending" | "mismatch" {
  const cap = details?.purchase_units?.[0]?.payments?.captures?.[0];
  if (!cap || details?.status !== "COMPLETED" || cap.status !== "COMPLETED") return "pending";
  if (cap.amount?.currency_code !== cfg.currency || cap.amount?.value !== money(orderTotal(cfg))) return "mismatch";
  return "ok";
}
