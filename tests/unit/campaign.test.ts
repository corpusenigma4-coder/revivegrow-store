import { test } from "node:test";
import assert from "node:assert/strict";
import { campaignPhase, offerOpen, remainingUntil, phaseMessage, hasDeadline } from "../../src/lib/campaign.ts";
import { formatPrice, formatParisDateTime } from "../../src/lib/format.ts";
import { CAMPAIGN } from "../../src/config/campaign.ts";

const dated = { enabled: true, startsAt: "2026-11-04T00:00:00+01:00", endsAt: "2026-11-11T23:59:59+01:00", lastDaysThresholdHours: 48 };

test("configuration actuelle : offre active, sans date ni compte à rebours", () => {
  assert.equal(CAMPAIGN.enabled, true);
  assert.equal(CAMPAIGN.endsAt, null);
  assert.equal(hasDeadline(CAMPAIGN), false);
  assert.equal(campaignPhase(Date.parse("2026-11-20T12:00:00Z"), CAMPAIGN), "active");
  assert.equal(campaignPhase(Date.parse("2030-01-01T00:00:00Z"), CAMPAIGN), "active");
});

test("désactivation : phase « off », offre fermée", () => {
  const p = campaignPhase(Date.now(), { ...CAMPAIGN, enabled: false });
  assert.equal(p, "off");
  assert.equal(offerOpen(p), false);
});

test("avec une date réelle : phases successives en heure de Paris", () => {
  assert.equal(campaignPhase(Date.parse("2026-11-03T22:59:59Z"), dated), "upcoming");
  assert.equal(campaignPhase(Date.parse("2026-11-04T10:00:00+01:00"), dated), "active");
  assert.equal(campaignPhase(Date.parse("2026-11-10T08:00:00+01:00"), dated), "last-days");
  assert.equal(campaignPhase(Date.parse("2026-11-11T09:00:00+01:00"), dated), "last-day");
  assert.equal(campaignPhase(Date.parse("2026-11-12T00:00:00+01:00"), dated), "ended");
  assert.equal(offerOpen("ended"), false);
});

test("fin sans début : seule la date de fin compte", () => {
  const endOnly = { ...dated, startsAt: null };
  assert.equal(campaignPhase(Date.parse("2020-01-01T00:00:00Z"), endOnly), "active");
});

test("le compte à rebours s'arrête à zéro et ne redémarre jamais", () => {
  assert.equal(remainingUntil(Date.parse("2026-12-01T00:00:00Z"), dated.endsAt).total, 0);
  const r = remainingUntil(Date.parse("2026-11-04T23:59:59+01:00"), dated.endsAt);
  assert.deepEqual([r.days, r.hours, r.minutes], [7, 0, 0]);
});

test("aucun message d'urgence sans date", () => {
  assert.equal(phaseMessage("active"), null);
  assert.match(phaseMessage("last-days") ?? "", /Derniers jours/);
});

test("dates invalides refusées", () => {
  assert.throws(() => campaignPhase(0, { ...dated, endsAt: "pas une date" }));
  assert.throws(() => campaignPhase(0, { ...dated, endsAt: dated.startsAt }));
});

test("pas de pourcentage ni prix barré sans justificatif ; prix 32,40 €", () => {
  assert.equal(CAMPAIGN.referencePrice.evidence, null);
  assert.equal(CAMPAIGN.price, 32.4);
  assert.equal(Math.round((1 - CAMPAIGN.price / CAMPAIGN.referencePrice.amount) * 100), 40);
});

test("formats français", () => {
  assert.equal(formatPrice(32.4), "32,40 €");
  assert.equal(formatParisDateTime(dated.endsAt), "mercredi 11 novembre 2026 à 23 h 59");
});
