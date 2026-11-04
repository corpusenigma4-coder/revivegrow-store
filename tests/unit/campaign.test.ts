import { test } from "node:test";
import assert from "node:assert/strict";
import { campaignPhase, remainingUntil, phaseMessage } from "../../src/lib/campaign.ts";
import { formatPrice, formatParisDateTime } from "../../src/lib/format.ts";
import { CAMPAIGN } from "../../src/config/campaign.ts";

const W = CAMPAIGN;

test("dates de campagne : 4 → 11 novembre 2026, 23 h 59 heure de Paris", () => {
  assert.equal(new Date(W.startsAt).toISOString(), "2026-11-03T23:00:00.000Z");
  assert.equal(new Date(W.endsAt).toISOString(), "2026-11-11T22:59:59.000Z");
});

test("phases successives", () => {
  assert.equal(campaignPhase(Date.parse("2026-11-03T22:59:59Z"), W), "upcoming");
  assert.equal(campaignPhase(Date.parse("2026-11-04T10:00:00+01:00"), W), "active");
  assert.equal(campaignPhase(Date.parse("2026-11-10T08:00:00+01:00"), W), "last-days");
  assert.equal(campaignPhase(Date.parse("2026-11-11T09:00:00+01:00"), W), "last-day");
  assert.equal(campaignPhase(Date.parse("2026-11-11T23:59:59+01:00"), W), "last-day");
  assert.equal(campaignPhase(Date.parse("2026-11-12T00:00:00+01:00"), W), "ended");
});

test("le compte à rebours s'arrête à zéro et ne redémarre jamais", () => {
  const after = remainingUntil(Date.parse("2026-12-01T00:00:00Z"), W.endsAt);
  assert.deepEqual(after, { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 });
  const r = remainingUntil(Date.parse("2026-11-04T23:59:59+01:00"), W.endsAt);
  assert.equal(r.days, 7); assert.equal(r.hours, 0); assert.equal(r.minutes, 0);
});

test("aucun message d'urgence pendant la phase normale", () => {
  assert.equal(phaseMessage("active"), null);
  assert.match(phaseMessage("last-days") ?? "", /Derniers jours/);
});

test("pas de pourcentage ni prix barré sans justificatif", () => {
  assert.equal(W.referencePrice.evidence, null);
  assert.equal(W.price, 32.4);
  assert.equal(Math.round((1 - W.price / W.referencePrice.amount) * 100), 40);
});

test("formats français", () => {
  assert.equal(formatPrice(32.4), "32,40 €");
  assert.equal(formatParisDateTime(W.endsAt), "mercredi 11 novembre 2026 à 23 h 59");
});
