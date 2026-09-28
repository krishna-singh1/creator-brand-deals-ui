"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Reveal } from "@/components/motion";
import { Button, Card, ErrorText, Input, PageTitle, SectionTitle, Skeleton } from "@/components/ui";
import { api, unwrap } from "@/lib/api/client";
import { errorMessage } from "@/lib/errors";
import { formatCount, formatPaise } from "@/lib/format";
import { istToday, monthLabel, type PaymentReport, PRESETS, type PresetKey, type Range, reportCsv } from "@/lib/money-report";

type Side = "CREATOR" | "BRAND";

const COPY: Record<Side, { eyebrow: string; title: string; subtitle: string; total: string; counterparty: string; awaiting: string; file: string }> = {
  CREATOR: {
    eyebrow: "Earnings",
    title: "What you've earned",
    subtitle: "Payments brands recorded for your deals, by payment date. Brands pay you directly, outside BrandDeal.",
    total: "Earned (confirmed by you)",
    counterparty: "Brand",
    awaiting: "Recorded by brands, waiting for you to confirm",
    file: "branddeal-earnings",
  },
  BRAND: {
    eyebrow: "Spend",
    title: "What you've spent",
    subtitle: "Payments you recorded on deals, by payment date. You pay creators directly, outside BrandDeal.",
    total: "Spent",
    counterparty: "Creator",
    awaiting: "Not yet confirmed by creators",
    file: "branddeal-spend",
  },
};

/** Earnings (creator) or spend (brand) over a chosen range: summary, month-by-month bars and the payment list. */
export function MoneyReport({ side }: { side: Side }) {
  const copy = COPY[side];
  const today = istToday();
  const [preset, setPreset] = useState<PresetKey | "CUSTOM">("LAST_12");
  const [custom, setCustom] = useState<Range>(() => PRESETS[2].range(today));
  const range = preset === "CUSTOM" ? custom : PRESETS.find((p) => p.key === preset)!.range(today);

  const query = useQuery({
    queryKey: ["money-report", side, range.from, range.to],
    queryFn: () =>
      side === "CREATOR"
        ? unwrap(api.GET("/creator/earnings", { params: { query: range } }))
        : unwrap(api.GET("/brand/spend", { params: { query: range } })),
    enabled: range.from <= range.to,
  });
  const r = query.data;

  return (
    <div className="flex flex-col gap-10">
      <PageTitle eyebrow={copy.eyebrow} title={copy.title} subtitle={copy.subtitle}>
        {r && r.payments.length > 0 && (
          <Button variant="secondary" onClick={() => download(`${copy.file}-${r.from}-to-${r.to}.csv`, reportCsv(r, copy.counterparty))}>
            Download CSV
          </Button>
        )}
      </PageTitle>

      <div className="flex flex-col gap-4">
        <div role="radiogroup" aria-label="Time frame" className="flex flex-wrap gap-2">
          {[...PRESETS.map((p) => ({ key: p.key as PresetKey | "CUSTOM", label: p.label })), { key: "CUSTOM" as const, label: "Custom" }].map((p) => (
            <button
              key={p.key}
              type="button"
              role="radio"
              aria-checked={preset === p.key}
              onClick={() => {
                if (p.key === "CUSTOM") setCustom(range);
                setPreset(p.key);
              }}
              className={`rounded-full px-4 py-2 text-sm transition-colors ${
                preset === p.key ? "bg-ink text-ivory shadow-soft" : "border border-zinc-200 bg-white/70 text-zinc-600 hover:text-ink"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {preset === "CUSTOM" && (
          <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-700">
            <label className="flex items-center gap-2">
              From
              <Input type="date" className="h-10 w-44" max={custom.to} value={custom.from} onChange={(e) => setCustom({ ...custom, from: e.target.value })} />
            </label>
            <label className="flex items-center gap-2">
              To
              <Input type="date" className="h-10 w-44" min={custom.from} max={today} value={custom.to} onChange={(e) => setCustom({ ...custom, to: e.target.value })} />
            </label>
          </div>
        )}
        <ErrorText>{range.from > range.to ? "The start date must be before the end date." : query.isError && errorMessage(query.error)}</ErrorText>
      </div>

      {!r ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      ) : (
        <>
          <Summary report={r} side={side} />
          <MonthBars report={r} />
          <Payments report={r} counterparty={copy.counterparty} awaitingLabel={copy.awaiting} />
        </>
      )}
    </div>
  );
}

function Summary({ report: r, side }: { report: PaymentReport; side: Side }) {
  const copy = COPY[side];
  const tiles = [
    { label: copy.total, value: formatPaise(side === "CREATOR" ? r.confirmedPaise : r.totalPaise), hint: `${formatCount(r.paymentCount)} payment${r.paymentCount === 1 ? "" : "s"}`, highlight: true },
    { label: "Awaiting confirmation", value: formatPaise(r.awaitingConfirmationPaise), hint: copy.awaiting },
    {
      label: side === "CREATOR" ? "Products received (barter)" : "Products given (barter)",
      value: formatPaise(r.productValuePaise),
      hint: `${formatCount(r.productDealCount)} completed barter deal${r.productDealCount === 1 ? "" : "s"}, at MRP`,
    },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {tiles.map((t, i) => (
        <Reveal key={t.label} delay={i * 60}>
          <Card tone={t.highlight ? "highlight" : "default"} className="flex h-full flex-col gap-2 p-6">
            <span className="text-xs uppercase tracking-[0.16em] text-zinc-500">{t.label}</span>
            <span className="font-display text-4xl tracking-tight text-ink">{t.value}</span>
            <span className="text-sm text-zinc-600">{t.hint}</span>
          </Card>
        </Reveal>
      ))}
    </div>
  );
}

/** Month-by-month bars: the full bar is everything recorded, the dark part what's confirmed. */
function MonthBars({ report: r }: { report: PaymentReport }) {
  const max = useMemo(() => Math.max(1, ...r.months.map((m) => m.totalPaise)), [r.months]);
  if (r.months.length < 2) return null;
  return (
    <Card>
      <SectionTitle title="Month by month" subtitle="Dark: confirmed · light: awaiting confirmation" />
      <div className="flex h-48 items-end gap-2" role="list" aria-label="Monthly totals">
        {r.months.map((m) => (
          <div key={m.month} role="listitem" className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2" title={`${monthLabel(m.month)}: ${formatPaise(m.totalPaise)}`}>
            <span className="text-[11px] text-zinc-500 opacity-0 transition-opacity group-hover:opacity-100">{m.totalPaise > 0 ? formatPaise(m.totalPaise) : ""}</span>
            <div className="flex w-full max-w-10 flex-col justify-end overflow-hidden rounded-t-lg bg-gold/25" style={{ height: `${(m.totalPaise / max) * 100}%`, minHeight: m.totalPaise > 0 ? 4 : 0 }}>
              <div className="w-full bg-ink" style={{ height: `${m.totalPaise ? (m.confirmedPaise / m.totalPaise) * 100 : 0}%` }} />
            </div>
            <span className="truncate text-[11px] text-zinc-500">{monthLabel(m.month, r.months.length > 6)}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function Payments({ report: r, counterparty, awaitingLabel }: { report: PaymentReport; counterparty: string; awaitingLabel: string }) {
  return (
    <Card className="overflow-x-auto p-0">
      <div className="px-7 pt-7">
        <SectionTitle title="Payments" subtitle={`${formatCount(r.paymentCount)} in this period, newest first`} />
      </div>
      {r.payments.length === 0 ? (
        <p className="px-7 pb-7 text-sm text-zinc-500">No payments in this period.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="border-y border-zinc-200 text-zinc-500">
            <tr>
              {["Paid on", "Campaign", counterparty, "Amount", "Status"].map((h) => (
                <th key={h} className="whitespace-nowrap px-7 py-3 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {r.payments.map((p) => (
              <tr key={p.dealId} className="border-b border-zinc-100 last:border-0">
                <td className="whitespace-nowrap px-7 py-3 text-zinc-600">{new Date(`${p.paidOn}T00:00:00Z`).toLocaleDateString("en-IN", { dateStyle: "medium", timeZone: "UTC" })}</td>
                <td className="px-7 py-3">
                  <Link href={`/deals/${p.dealId}`} className="link-underline font-medium text-ink">
                    {p.campaignTitle}
                  </Link>
                </td>
                <td className="px-7 py-3">{p.counterpartyName}</td>
                <td className="whitespace-nowrap px-7 py-3 font-medium text-ink">{formatPaise(p.amountPaise)}</td>
                <td className="px-7 py-3">
                  {p.confirmed ? (
                    <span className="text-emerald-800">Confirmed</span>
                  ) : (
                    <span className="text-amber-900" title={awaitingLabel}>
                      Awaiting confirmation
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}

function download(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  a.click();
  URL.revokeObjectURL(url);
}
