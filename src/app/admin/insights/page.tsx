"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { Card, PageTitle, SectionTitle, Select, Skeleton } from "@/components/ui";
import { api, type components, unwrap } from "@/lib/api/client";
import { formatCount, formatDateTime, formatPaise } from "@/lib/format";

import { AdminShell } from "../admin-shell";

type Insights = components["schemas"]["AdminInsights"];
type Step = components["schemas"]["FunnelStepCount"];

const PERIODS = [7, 30, 90, 365] as const;

const STEP_LABELS: Record<Step["step"], string> = {
  SIGNED_UP: "Joined",
  PROFILE_COMPLETE: "Profile complete",
  VERIFICATION_SUBMITTED: "Asked for verification",
  VERIFIED: "Verified",
  APPLIED: "Applied or accepted an invite",
  CAMPAIGN_PUBLISHED: "Published a campaign",
  GOT_APPLICANT: "Got an applicant",
  DEAL: "Has a deal",
  DEAL_COMPLETED: "Completed a deal",
};

export default function AdminInsightsPage() {
  return (
    <AdminShell>
      <InsightsView />
    </AdminShell>
  );
}

function InsightsView() {
  const [days, setDays] = useState<(typeof PERIODS)[number]>(30);
  const { data } = useQuery({
    queryKey: ["admin", "insights", days],
    queryFn: () => unwrap(api.GET("/admin/insights", { params: { query: { days } } })),
  });

  return (
    <div className="flex flex-col gap-10">
      <PageTitle
        eyebrow="Admin"
        title="Insights"
        subtitle="How far new creators and brands get, and what deals look like. From BrandDeal's own data; nothing is sent to a third party."
      >
        <label className="flex items-center gap-3 text-sm text-zinc-600">
          Period
          <Select value={days} onChange={(e) => setDays(Number(e.target.value) as (typeof PERIODS)[number])} className="w-40">
            {PERIODS.map((d) => (
              <option key={d} value={d}>
                Last {d} days
              </option>
            ))}
          </Select>
        </label>
      </PageTitle>

      {!data ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      ) : (
        <>
          <p className="-mt-6 text-sm text-zinc-500">
            {formatDateTime(data.from)} – {formatDateTime(data.to)} · {formatCount(data.signups.total)} new accounts,{" "}
            {formatCount(data.signups.noRoleYet)} haven&apos;t chosen creator or brand yet.
          </p>
          <div className="grid gap-6 lg:grid-cols-2">
            <Funnel title="Creators" subtitle="Creators who joined in the period, and how many have reached each step by now." steps={data.creatorFunnel} />
            <Funnel title="Brands" subtitle="Brands who joined in the period, and how many have reached each step by now." steps={data.brandFunnel} />
          </div>
          <DealEconomics deals={data.deals} />
        </>
      )}
    </div>
  );
}

function Funnel({ title, subtitle, steps }: { title: string; subtitle: string; steps: Step[] }) {
  const start = steps[0]?.count ?? 0;
  return (
    <Card>
      <SectionTitle title={title} subtitle={subtitle} />
      <ol className="flex flex-col gap-4">
        {steps.map((s, i) => {
          const previous = i === 0 ? null : steps[i - 1].count;
          const share = start > 0 ? s.count / start : 0;
          return (
            <li key={s.step} className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-4 text-sm">
                <span className="text-zinc-700">{STEP_LABELS[s.step]}</span>
                <span className="font-display text-xl text-ink">{formatCount(s.count)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-zinc-100" aria-hidden>
                <div className="h-full rounded-full bg-gold" style={{ width: `${Math.round(share * 100)}%` }} />
              </div>
              {previous !== null && (
                <span className="text-xs text-zinc-500">
                  {percent(s.count, start)} of joined · {percent(s.count, previous)} of the step before
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

function DealEconomics({ deals }: { deals: Insights["deals"] }) {
  const tiles = [
    { label: "Deals created", value: formatCount(deals.created), hint: `${formatCount(deals.completed)} completed so far` },
    {
      label: "Deals per active brand",
      value: deals.activeBrands > 0 ? (deals.created / deals.activeBrands).toFixed(1) : "—",
      hint: `${formatCount(deals.activeBrands)} brands with a deal`,
    },
    {
      label: "Cash deal value",
      value: deals.medianCashPaise != null ? formatPaise(deals.medianCashPaise) : "—",
      hint: deals.averageCashPaise != null ? `median · average ${formatPaise(deals.averageCashPaise)}` : "no cash deals",
    },
    {
      label: "Barter share",
      value: percent(deals.product, deals.created),
      hint: `${formatCount(deals.cash)} cash · ${formatCount(deals.product)} product · ${formatCount(deals.productPlusCash)} product + cash`,
    },
    {
      label: "Repeat brand–creator pairs",
      value: percent(deals.repeatPairDeals, deals.created),
      hint: `${formatCount(deals.repeatPairDeals)} deals with a pair that worked together before`,
    },
    {
      label: "Time to complete",
      value: deals.medianDaysToComplete != null ? `${deals.medianDaysToComplete} days` : "—",
      hint: "median, from deal to completion",
    },
    {
      label: "Cancelled / disputed",
      value: `${percent(deals.cancelled, deals.created)} / ${percent(deals.disputed, deals.created)}`,
      hint: `${formatCount(deals.cancelled)} cancelled · ${formatCount(deals.disputed)} disputed`,
    },
    {
      label: "Declared payments",
      value: formatPaise(deals.declaredPaymentsPaise ?? 0),
      hint: "on these deals, paid off-platform",
    },
  ];
  return (
    <section className="flex flex-col gap-4">
      <SectionTitle title="Deals" subtitle="Deals created in the period. These numbers inform pricing: subscription vs a fee on deals." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => (
          <Card key={t.label} className="flex flex-col gap-2 p-6">
            <span className="text-xs uppercase tracking-[0.16em] text-zinc-500">{t.label}</span>
            <span className="font-display text-3xl tracking-tight text-ink">{t.value}</span>
            <span className="text-sm text-zinc-600">{t.hint}</span>
          </Card>
        ))}
      </div>
    </section>
  );
}

function percent(part: number, whole: number) {
  return whole > 0 ? `${Math.round((part / whole) * 100)}%` : "—";
}
