"use client";

import type { ReactNode } from "react";

import { type Campaign, COMPENSATION_LABELS, formatDate, formatOffer, PLATFORM_LABELS } from "@/lib/campaigns";
import { useCategories, useCities } from "@/lib/catalog";
import { DELIVERABLE_LABELS, formatCount } from "@/lib/format";

import { Card, SectionTitle } from "./ui";

/** Read-only brief shared by the brand's campaign page and the creator's campaign page. */
export function CampaignBrief({ campaign: c }: { campaign: Campaign }) {
  const { data: categories = [] } = useCategories();
  const { data: cities = [] } = useCities();
  const niche = c.categoryIds.map((id) => categories.find((x) => x.id === id)?.name).filter(Boolean).join(", ");
  const cityNames = (c.criteria.cityIds ?? []).map((id) => cities.find((x) => x.id === id)?.name).filter(Boolean);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="flex flex-col gap-6">
        <Card>
          <SectionTitle title="The brief" />
          <p className="whitespace-pre-line text-[15px] leading-relaxed text-zinc-700">{c.description}</p>
          {(c.productName || c.productUrl) && (
            <p className="mt-4 text-sm text-zinc-600">
              Product:{" "}
              {c.productUrl ? (
                <a href={c.productUrl} target="_blank" rel="noreferrer" className="link-underline text-ink">
                  {c.productName ?? c.productUrl}
                </a>
              ) : (
                <span className="text-ink">{c.productName}</span>
              )}
            </p>
          )}
        </Card>
        <Card>
          <SectionTitle title="Deliverables" subtitle={`On ${PLATFORM_LABELS[c.platform]}, per creator`} />
          <ul className="flex flex-col divide-y divide-zinc-100">
            {c.deliverables.map((d) => (
              <li key={d.deliverableType} className="flex items-center justify-between py-3 text-sm">
                <span className="text-ink">{DELIVERABLE_LABELS[d.deliverableType]}</span>
                <span className="font-display text-lg">× {d.quantity}</span>
              </li>
            ))}
          </ul>
        </Card>
        {(c.guidelines || (c.hashtags ?? []).length > 0 || (c.mentions ?? []).length > 0) && (
          <Card>
            <SectionTitle title="Guidelines" />
            {c.guidelines && <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-700">{c.guidelines}</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              {[...(c.hashtags ?? []), ...(c.mentions ?? [])].map((t) => (
                <span key={t} className="rounded-full bg-cream px-3 py-1 text-xs text-zinc-700">
                  {t}
                </span>
              ))}
            </div>
          </Card>
        )}
      </div>
      <Card className="h-fit">
        <dl className="flex flex-col gap-4 text-sm">
          <Fact label="Compensation">{`${COMPENSATION_LABELS[c.compensationType]} · ${formatOffer(c)}`}</Fact>
          <Fact label="Niche">{niche || "—"}</Fact>
          <Fact label="Followers">{`${formatCount(c.criteria.followersMin)}–${formatCount(c.criteria.followersMax)}`}</Fact>
          {cityNames.length > 0 && <Fact label="Cities">{cityNames.join(", ")}</Fact>}
          <Fact label="Creators needed">{String(c.creatorsNeeded)}</Fact>
          <Fact label="Apply by">{formatDate(c.applyBy)}</Fact>
          <Fact label="Content goes live">{`${formatDate(c.contentWindowStart)} – ${formatDate(c.contentWindowEnd)}`}</Fact>
          {c.briefUrl && (
            <Fact label="Brief">
              <a href={c.briefUrl} target="_blank" rel="noreferrer" className="link-underline text-ink">
                Download PDF
              </a>
            </Fact>
          )}
        </dl>
      </Card>
    </div>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-zinc-100 pb-3 last:border-0 last:pb-0">
      <dt className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">{label}</dt>
      <dd className="text-ink">{children}</dd>
    </div>
  );
}
