import type { components } from "./api/client";

export type PaymentReport = components["schemas"]["PaymentReport"];

/** A date range as ISO dates (yyyy-mm-dd), inclusive. */
export type Range = { from: string; to: string };

const iso = (d: Date) => d.toISOString().slice(0, 10);
const utc = (y: number, m: number, day: number) => new Date(Date.UTC(y, m, day));

/** Today as an IST calendar date (payments are dated in IST). */
export function istToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

export type PresetKey = "THIS_MONTH" | "LAST_3" | "LAST_12" | "THIS_FY";

/** Quick ranges. The Indian financial year runs 1 April – 31 March. */
export const PRESETS: { key: PresetKey; label: string; range: (today: string) => Range }[] = [
  { key: "THIS_MONTH", label: "This month", range: (t) => ({ from: `${t.slice(0, 7)}-01`, to: t }) },
  { key: "LAST_3", label: "Last 3 months", range: (t) => monthsBack(t, 3) },
  { key: "LAST_12", label: "Last 12 months", range: (t) => monthsBack(t, 12) },
  {
    key: "THIS_FY",
    label: "This financial year",
    range: (t) => {
      const [y, m] = t.split("-").map(Number);
      return { from: `${m >= 4 ? y : y - 1}-04-01`, to: t };
    },
  },
];

function monthsBack(today: string, months: number): Range {
  const [y, m] = today.split("-").map(Number);
  return { from: iso(utc(y, m - 1 - (months - 1), 1)), to: today };
}

/** "2026-09" → "Sep 2026" (or "Sep" when short). */
export function monthLabel(month: string, short = false) {
  const [y, m] = month.split("-").map(Number);
  return utc(y, m - 1, 1).toLocaleDateString("en-IN", { month: "short", year: short ? undefined : "numeric", timeZone: "UTC" });
}

/** CSV of the payments in a report, for accountants or spreadsheets (amounts in rupees). */
export function reportCsv(report: PaymentReport, counterpartyHeader: string) {
  const escape = (v: string) => (/[",\n]/.test(v) ? `"${v.replaceAll('"', '""')}"` : v);
  const rows = [
    ["Paid on", "Campaign", counterpartyHeader, "Amount (INR)", "Mode", "Confirmed"],
    ...report.payments.map((p) => [
      p.paidOn,
      p.campaignTitle,
      p.counterpartyName,
      (p.amountPaise / 100).toFixed(2),
      p.mode ?? "",
      p.confirmed ? "yes" : "no",
    ]),
  ];
  return rows.map((r) => r.map((c) => escape(String(c))).join(",")).join("\n");
}
