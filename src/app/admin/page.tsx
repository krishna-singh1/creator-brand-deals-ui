"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { Reveal } from "@/components/motion";
import { Card, PageTitle, Skeleton } from "@/components/ui";
import { api, unwrap } from "@/lib/api/client";
import { formatCount, formatPaise } from "@/lib/format";

import { AdminShell } from "./admin-shell";

export default function AdminOverviewPage() {
  return (
    <AdminShell>
      <Overview />
    </AdminShell>
  );
}

function Overview() {
  const { data: m } = useQuery({ queryKey: ["admin", "metrics"], queryFn: () => unwrap(api.GET("/admin/metrics")) });
  const tiles = m
    ? [
        { label: "Creators", value: formatCount(m.creators), hint: `${formatCount(m.verifiedCreators)} verified` },
        {
          label: "Pending verifications",
          value: formatCount(m.pendingVerifications),
          href: "/admin/verifications",
          highlight: m.pendingVerifications > 0,
        },
        { label: "Brands", value: formatCount(m.brands) },
        { label: "Live campaigns", value: formatCount(m.publishedCampaigns), href: "/admin/campaigns" },
        { label: "Applications", value: formatCount(m.applications) },
        { label: "Deals", value: formatCount(m.deals), hint: `${formatCount(m.completedDeals)} completed`, href: "/admin/deals" },
        { label: "Declared payments", value: formatPaise(m.declaredGmvPaise ?? 0), hint: "Paid off-platform, recorded by brands" },
      ]
    : [];

  return (
    <div className="flex flex-col gap-10">
      <PageTitle eyebrow="Admin" title="Marketplace at a glance" subtitle="Live counts across creators, brands, campaigns and deals." />
      {!m ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tiles.map((t, i) => {
            const body = (
              <Card interactive={!!t.href} tone={t.highlight ? "highlight" : "default"} className="flex h-full flex-col gap-2 p-6">
                <span className="text-xs uppercase tracking-[0.16em] text-zinc-500">{t.label}</span>
                <span className="font-display text-4xl tracking-tight text-ink">{t.value}</span>
                {t.hint && <span className="text-sm text-zinc-600">{t.hint}</span>}
              </Card>
            );
            return (
              <Reveal key={t.label} delay={i * 50}>
                {t.href ? (
                  <Link href={t.href} className="block h-full">
                    {body}
                  </Link>
                ) : (
                  body
                )}
              </Reveal>
            );
          })}
        </div>
      )}
    </div>
  );
}
