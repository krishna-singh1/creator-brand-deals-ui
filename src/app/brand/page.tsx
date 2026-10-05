"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { ActionItems } from "@/components/action-items";
import { AppShell } from "@/components/app-shell";
import { BrandVerificationNotice } from "@/components/brand-verification-notice";
import { DashboardHero, greeting } from "@/components/dashboard";
import { DealsNeedingYou } from "@/components/deals-needing-you";
import { LoadError } from "@/components/load-error";
import { RequireSession } from "@/components/require-session";
import { Card, Skeleton } from "@/components/ui";
import { api, unwrap } from "@/lib/api/client";
import { formatDeadline, formatOffer } from "@/lib/campaigns";
import { PRODUCT } from "@/lib/product";

export default function BrandHome() {
  return (
    <RequireSession role="BRAND">
      {(me) => (
        <AppShell me={me}>
          <Dashboard name={me.displayName} />
        </AppShell>
      )}
    </RequireSession>
  );
}

function Dashboard({ name }: { name?: string }) {
  const { data, error } = useQuery({ queryKey: ["brand", "dashboard"], queryFn: () => unwrap(api.GET("/brand/dashboard")) });
  if (error && !data) return <LoadError error={error} />;
  return (
    <div className="flex flex-col gap-8">
      {data ? (
        <DashboardHero
          eyebrow="Brand suite"
          title={name ? `${greeting()}, ${name}` : `Welcome to ${PRODUCT.name}`}
          subtitle="Brief verified creators who genuinely belong in your world, then track every deal to the live post."
          action={{ href: "/brand/campaigns/new", label: "Write a brief" }}
          kpis={[
            { label: "Live campaigns", value: data.activeCampaigns, href: "/brand/campaigns" },
            { label: "New applicants", value: data.newApplicants, href: "/brand/campaigns", highlight: data.newApplicants > 0 },
            { label: "Active deals", value: data.activeDeals, href: "/deals" },
            { label: "Completed", value: data.completedDeals ?? 0 },
          ]}
        />
      ) : (
        <Skeleton className="h-72 rounded-[2rem]" />
      )}
      <BrandVerificationNotice suggestDraft />
      {data && data.actionItems.length > 0 && <ActionItems items={data.actionItems} emptyText="" />}
      <DealsNeedingYou partner="creator" />
      <LiveCampaigns />
    </div>
  );
}

/** Live campaigns at a glance: applicants so far and how many creators are approved out of those needed. */
function LiveCampaigns() {
  const { data } = useQuery({
    queryKey: ["campaigns", "mine", "PUBLISHED", "home"],
    queryFn: () => unwrap(api.GET("/campaigns/mine", { params: { query: { status: "PUBLISHED", limit: 4 } } })),
  });
  const items = data?.items ?? [];
  if (!data) return <Skeleton className="h-48" />;
  return (
    <section className="flex flex-col gap-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-gold-deep">Live now</p>
          <h2 className="mt-2 font-display text-2xl tracking-tight text-ink">Your campaigns</h2>
        </div>
        <Link href="/brand/campaigns" className="link-underline shrink-0 text-sm text-zinc-600 hover:text-ink">
          All campaigns
        </Link>
      </div>
      {items.length === 0 ? (
        <Card className="flex flex-col items-start gap-3">
          <p className="font-display text-xl text-ink">No campaign is live</p>
          <p className="text-sm text-zinc-600">A clear brief with a fair budget usually draws its first applicants within a day.</p>
          <Link href="/brand/creators" className="link-underline text-sm font-medium text-ink">
            Or browse verified creators →
          </Link>
        </Card>
      ) : (
        <ul className="grid gap-5 md:grid-cols-2">
          {items.map((c) => {
            const filled = Math.min(100, Math.round((c.approvedCount / Math.max(1, c.creatorsNeeded)) * 100));
            return (
              <li key={c.id}>
                <Link href={`/brand/campaigns/${c.id}/applicants`} className="block h-full">
                  <Card interactive className="flex h-full flex-col gap-4 p-6">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-display text-xl leading-snug tracking-tight text-ink">{c.title}</p>
                      <span className="shrink-0 text-xs uppercase tracking-[0.14em] text-zinc-500">{formatDeadline(c.applyBy)}</span>
                    </div>
                    <p className="text-sm text-zinc-600">{formatOffer(c)}</p>
                    <div className="mt-auto flex flex-col gap-2 border-t border-zinc-100 pt-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-ink">
                          {c.applicationCount} applicant{c.applicationCount === 1 ? "" : "s"}
                        </span>
                        <span className="text-zinc-600">
                          {c.approvedCount} / {c.creatorsNeeded} approved
                        </span>
                      </div>
                      <div className="h-1 overflow-hidden rounded-full bg-cream" aria-hidden>
                        <div className="h-full rounded-full bg-gold" style={{ width: `${filled}%` }} />
                      </div>
                    </div>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
