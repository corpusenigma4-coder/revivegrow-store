import { test } from "node:test";
import assert from "node:assert/strict";
import { buildPayPalOrder, missingFields, captureConfirmed, orderTotal, orderReference } from "../../src/lib/order.ts";

const cfg = { price: 32.4, currency: "EUR", shipping: 0, quantity: 1 as const, itemName: "Pack Sommeil REVIVE GROW", itemDescription: "Oreiller cervical + masque offert + bandelettes offertes", brandName: "REVIVE GROW" };
const customer = { email: "marie@example.fr", fullName: "Marie Durand", address1: "12 rue des Lilas", address2: "Bât. B", city: "Lyon", postalCode: "69003", country: "fr" };

test("total : 32,40 € livraison gratuite, quantité 1", () => {
  assert.equal(orderTotal(cfg), 32.4);
});

test("la commande PayPal contient l'e-mail, l'adresse saisie et le bon montant", () => {
  const o = buildPayPalOrder(customer, cfg, "RG-TEST-001");
  const u = o.purchase_units[0];
  assert.equal(o.payer.email_address, "marie@example.fr");
  assert.equal(u.custom_id, "marie@example.fr");
  assert.equal(u.invoice_id, "RG-TEST-001");
  assert.equal(u.amount.value, "32.40");
  assert.equal(u.amount.currency_code, "EUR");
  assert.equal(u.amount.breakdown.shipping.value, "0.00");
  assert.equal(u.items[0].quantity, "1");
  assert.equal(u.shipping.name.full_name, "Marie Durand");
  assert.deepEqual(u.shipping.address, { address_line_1: "12 rue des Lilas", address_line_2: "Bât. B", admin_area_2: "Lyon", postal_code: "69003", country_code: "FR" });
  assert.equal(o.application_context.shipping_preference, "SET_PROVIDED_ADDRESS");
});

test("complément d'adresse facultatif, téléphone jamais demandé", () => {
  const o = buildPayPalOrder({ ...customer, address2: "" }, cfg, "R");
  assert.ok(!("address_line_2" in o.purchase_units[0].shipping.address));
  assert.ok(!JSON.stringify(o).includes("phone"));
});

test("validation souple : seuls e-mail, nom, adresse, ville, code postal, pays", () => {
  assert.deepEqual(missingFields(customer), []);
  assert.deepEqual(missingFields({ ...customer, email: "pas-un-email" }), ["email"]);
  assert.deepEqual(missingFields({ ...customer, address2: undefined }), []);
  assert.deepEqual(missingFields({ email: "a@b.co" }).sort(), ["address1", "city", "country", "fullName", "postalCode"].sort());
  assert.deepEqual(missingFields({ ...customer, postalCode: "SW1A 1AA", country: "GB" }), []);
});

test("confirmation uniquement si PayPal déclare COMPLETED au bon montant", () => {
  const ok = { status: "COMPLETED", purchase_units: [{ payments: { captures: [{ status: "COMPLETED", amount: { currency_code: "EUR", value: "32.40" } }] } }] };
  assert.equal(captureConfirmed(ok, cfg), "ok");
  assert.equal(captureConfirmed({ ...ok, status: "PENDING" }, cfg), "pending");
  assert.equal(captureConfirmed({ status: "COMPLETED", purchase_units: [{ payments: { captures: [{ status: "PENDING", amount: { currency_code: "EUR", value: "32.40" } }] } }] }, cfg), "pending");
  assert.equal(captureConfirmed({ status: "COMPLETED", purchase_units: [{ payments: { captures: [{ status: "COMPLETED", amount: { currency_code: "EUR", value: "1.00" } }] } }] }, cfg), "mismatch");
  assert.equal(captureConfirmed(undefined, cfg), "pending");
});

test("référence de commande unique et lisible", () => {
  assert.match(orderReference(1_700_000_000_000, 0.5), /^RG-[0-9A-Z]+-[0-9A-Z]{3}$/);
  assert.notEqual(orderReference(1, 0.1), orderReference(1, 0.2));
});
