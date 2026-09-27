"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { use } from "react";

import { AppShell } from "@/components/app-shell";
import { CampaignBrief } from "@/components/campaign-brief";
import { BrandLine, CompensationBadge, MatchScore } from "@/components/campaign-bits";
import { ContentSkeleton, RequireSession } from "@/components/require-session";
import { Button, Card, PageTitle, SectionTitle } from "@/components/ui";
import { api, unwrap } from "@/lib/api/client";
import { formatDeadline } from "@/lib/campaigns";
import { DELIVERABLE_LABELS, formatPaise } from "@/lib/format";

export default function CreatorCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <RequireSession role="CREATOR">
      {(me) => (
        <AppShell me={me}>
          <Detail id={id} />
        </AppShell>
      )}
    </RequireSession>
  );
}

function Detail({ id }: { id: string }) {
  const { data } = useQuery({
    queryKey: ["campaigns", "public", id],
    queryFn: () => unwrap(api.GET("/campaigns/{campaignId}/public", { params: { path: { campaignId: id } } })),
  });
  if (!data) return <ContentSkeleton />;
  const { campaign: c, eligible, ineligibleReasons = [], matchScore, suggestedQuote, lowValueOffer } = data;
  const total = suggestedQuote.reduce(
    (acc, l) => ({ min: acc.min + l.range.minPaise, max: acc.max + l.range.maxPaise }),
    { min: 0, max: 0 },
  );

  return (
    <div className="flex flex-col gap-10">
      <Link href="/creator/campaigns" className="text-sm text-zinc-500 hover:text-ink">
        ← All campaigns
      </Link>
      <PageTitle eyebrow={formatDeadline(c.applyBy)} title={c.title}>
        <MatchScore score={matchScore} size={72} />
      </PageTitle>
      <div className="flex flex-wrap items-center gap-4">
        <BrandLine brand={c.brand} />
        <CompensationBadge type={c.compensationType} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card className={eligible ? "border-emerald-200" : "border-amber-200"}>
          {eligible ? (
            <div className="flex flex-col gap-2">
              <p className="font-display text-2xl text-ink">You&apos;re a fit for this brief</p>
              <p className="text-sm text-zinc-600">Applications with a pitch and a quote open in the next release.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="font-display text-2xl text-ink">Not eligible yet</p>
              <ul className="flex flex-col gap-2 text-sm text-zinc-700">
                {ineligibleReasons.map((r) => (
                  <li key={r} className="flex items-start gap-2">
                    <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-500" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <Button className="mt-6" disabled title="Applications open in the next release">
            Apply (coming soon)
          </Button>
        </Card>

        <Card>
          <SectionTitle
            title="Your suggested quote"
            subtitle={
              c.compensationType === "PRODUCT"
                ? "This is a barter campaign: the product is the fee."
                : "Based on your followers, engagement and our rate table."
            }
          />
          {suggestedQuote.length > 0 ? (
            <ul className="flex flex-col gap-3 text-sm">
              {suggestedQuote.map((l) => (
                <li key={l.deliverableType} className="flex items-center justify-between gap-3">
                  <span className="text-zinc-700">
                    {l.quantity} × {DELIVERABLE_LABELS[l.deliverableType]}
                  </span>
                  <span className="font-medium text-ink">
                    {formatPaise(l.range.minPaise)}–{formatPaise(l.range.maxPaise)}
                  </span>
                </li>
              ))}
              <li className="mt-2 flex items-center justify-between border-t border-zinc-100 pt-3">
                <span className="text-xs uppercase tracking-[0.16em] text-zinc-500">Total</span>
                <span className="font-display text-xl text-ink">
                  {formatPaise(total.min)}–{formatPaise(total.max)}
                </span>
              </li>
            </ul>
          ) : (
            <p className="text-sm text-zinc-600">No cash quote needed.</p>
          )}
          {lowValueOffer && (
            <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
              The product is worth less than half of your usual rate for this work. Decide if it&apos;s worth it for you.
            </p>
          )}
        </Card>
      </div>

      <CampaignBrief campaign={c} />
    </div>
  );
}
