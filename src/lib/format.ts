/** Formats français (prix, dates) — espaces insécables conformes à l'usage. */
const NBSP = " ";

export function formatPrice(amount: number, currency = "EUR"): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency, minimumFractionDigits: 2 })
    .format(amount)
    .replace(/ | /g, NBSP);
}

/** Ex. « mercredi 11 novembre 2026 à 23 h 59 » (heure de Paris). */
export function formatParisDateTime(iso: string): string {
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    weekday: "long", day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("weekday")} ${get("day")} ${get("month")} ${get("year")} à ${get("hour")}${NBSP}h${NBSP}${get("minute")}`;
}

/** Ex. « 11 novembre » */
export function formatParisDayMonth(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", day: "numeric", month: "long" }).format(new Date(iso));
}
