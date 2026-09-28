"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { use } from "react";

import { AppShell } from "@/components/app-shell";
import { BrandLine, CompensationBadge } from "@/components/campaign-bits";
import { ContentSkeleton, RequireSession } from "@/components/require-session";
import { Card, PageTitle, SectionTitle, StatusBadge } from "@/components/ui";
import { api, unwrap } from "@/lib/api/client";
import { formatDate } from "@/lib/campaigns";
import { CANCELLABLE, type Deal, dealKey, dealSteps, DISPUTABLE, NEXT_ACTION_COPY } from "@/lib/deals";
import { DELIVERABLE_LABELS, formatDateTime, formatPaise } from "@/lib/format";

import { DeliverablesPanel } from "./deliverables-panel";
import { DisputeBanner, ReportProblem } from "./dispute-panel";
import { MessagesPanel } from "./messages-panel";
import { CancelDeal, PaymentPanel, ReviewPanel, ShipmentPanel } from "./step-panels";

const EVENT_LABELS: Record<string, string> = {
  DEAL_CREATED: "Deal created",
  PRODUCT_SHIPPED: "Product shipped",
  PRODUCT_RECEIVED: "Product received",
  SUBMISSION_CREATED: "Content submitted",
  SUBMISSION_APPROVED: "Content approved",
  CHANGES_REQUESTED: "Changes requested",
  CONTENT_APPROVED: "All content approved",
  PAYMENT_MARKED: "Payment recorded",
  PAYMENT_CONFIRMED: "Payment confirmed",
  COMPLETED: "Deal completed",
  CANCELLED: "Deal cancelled",
  REVIEW_SUBMITTED: "Rating left",
  REMINDER_CONTENT_DUE: "Reminder sent: content due soon",
  REMINDER_PAYMENT_PENDING: "Reminder sent: payment pending",
  DISPUTE_RAISED: "Issue reported to BrandDeal",
  DISPUTE_RESOLVED: "Issue resolved by BrandDeal",
};

export default function DealPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <RequireSession>
      {(me) => (
        <AppShell me={me}>
          <DealView id={id} isBrand={me.role === "BRAND"} meId={me.id} />
        </AppShell>
      )}
    </RequireSession>
  );
}

function DealView({ id, isBrand, meId }: { id: string; isBrand: boolean; meId: string }) {
  const { data: deal } = useQuery({
    queryKey: dealKey(id),
    queryFn: () => unwrap(api.GET("/deals/{dealId}", { params: { path: { dealId: id } } })),
  });
  if (!deal) return <ContentSkeleton />;

  const partnerName = isBrand ? deal.creator.displayName : deal.brand.brandName;
  const next = deal.nextAction ? NEXT_ACTION_COPY[deal.nextAction] : undefined;
  const hasProduct = deal.compensationType !== "CASH";
  const hasPayment = deal.compensationType !== "PRODUCT" && deal.agreedTotalPaise > 0;
  const nothingSubmitted = deal.deliverables.every((d) => d.status === "PENDING" && d.revisionCount === 0);
  const canSubmit = deal.nextAction === "SUBMIT_CONTENT" || deal.status === "IN_PROGRESS" || deal.status === "UNDER_REVIEW";

  return (
    <div className="flex flex-col gap-10">
      <Link href="/deals" className="text-sm text-zinc-500 hover:text-ink">
        ← All deals
      </Link>
      <PageTitle eyebrow={isBrand ? `Deal with ${partnerName}` : "Deal"} title={deal.campaignTitle}>
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={deal.status} />
          <CompensationBadge type={deal.compensationType} />
          <span className="font-display text-2xl text-ink">{formatPaise(deal.agreedTotalPaise)}</span>
        </div>
      </PageTitle>
      {!isBrand && <BrandLine brand={deal.brand} />}

      {deal.status !== "CANCELLED" && deal.status !== "DISPUTED" && <Progress deal={deal} />}
      <DisputeBanner deal={deal} />

      {deal.status === "CANCELLED" ? (
        <Card tone="danger">
          <p className="font-display text-2xl text-ink">This deal was cancelled</p>
          {deal.cancelReason && <p className="mt-2 text-sm text-zinc-700">Reason: {deal.cancelReason}</p>}
        </Card>
      ) : (
        next &&
        deal.status !== "DISPUTED" && (
          <Card tone="highlight">
            <p className="font-display text-2xl text-ink">{next.title}</p>
            <p className="mt-1 text-sm text-zinc-700">{next.body}</p>
          </Card>
        )
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="flex flex-col gap-6">
          {hasProduct && <ShipmentPanel deal={deal} isBrand={isBrand} />}
          <DeliverablesPanel deal={deal} isBrand={isBrand} canSubmit={canSubmit} />
          {hasPayment && <PaymentPanel deal={deal} isBrand={isBrand} />}
          {deal.status === "COMPLETED" && <ReviewPanel deal={deal} partnerName={partnerName} />}
          {CANCELLABLE.includes(deal.status) && nothingSubmitted && <CancelDeal deal={deal} />}
          {DISPUTABLE.includes(deal.status) && <ReportProblem deal={deal} />}
        </div>
        <div className="flex flex-col gap-6">
          <MessagesPanel dealId={deal.id} meId={meId} partnerName={partnerName} readOnly={deal.status === "CANCELLED"} />
          <Card>
            <SectionTitle title={isBrand ? "Creator contact" : "Brand contact"} />
            <dl className="flex flex-col gap-2 text-sm">
              <dd className="font-medium text-ink">{deal.counterpartyContact.name}</dd>
              {deal.counterpartyContact.email && (
                <dd>
                  <a className="link-underline text-ink" href={`mailto:${deal.counterpartyContact.email}`}>
                    {deal.counterpartyContact.email}
                  </a>
                </dd>
              )}
              {deal.counterpartyContact.phone && (
                <dd>
                  <a className="link-underline text-ink" href={`tel:${deal.counterpartyContact.phone}`}>
                    {deal.counterpartyContact.phone}
                  </a>
                </dd>
              )}
            </dl>
          </Card>
          <Terms deal={deal} />
          <Timeline deal={deal} />
        </div>
      </div>
    </div>
  );
}

function Progress({ deal }: { deal: Deal }) {
  const steps = dealSteps(deal);
  const order = steps.map((s) => s.key);
  const current = deal.status === "COMPLETED" ? order.length - 1 : Math.max(0, order.indexOf(deal.status));
  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-3" aria-label="Deal progress">
      {steps.map((s, i) => (
        <li key={s.key} className="flex items-center gap-2">
          <span
            className={`grid size-7 place-items-center rounded-full text-xs font-medium transition-colors ${
              i <= current ? "bg-ink text-gold-soft" : "border border-zinc-300 text-zinc-400"
            }`}
            aria-current={i === current ? "step" : undefined}
          >
            {i < current || deal.status === "COMPLETED" ? "✓" : i + 1}
          </span>
          <span className={`text-sm ${i <= current ? "text-ink" : "text-zinc-400"}`}>{s.label}</span>
          {i < steps.length - 1 && <span aria-hidden className={`mx-1 h-px w-6 ${i < current ? "bg-ink" : "bg-zinc-300"}`} />}
        </li>
      ))}
    </ol>
  );
}

function Terms({ deal }: { deal: Deal }) {
  const t = deal.terms;
  return (
    <Card>
      <SectionTitle title="What was agreed" />
      <ul className="flex flex-col gap-1 text-sm text-zinc-700">
        {t.deliverables.map((d) => (
          <li key={d.deliverableType}>
            {d.quantity} × {DELIVERABLE_LABELS[d.deliverableType]}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm text-zinc-600">
        Go live between {formatDate(t.contentWindowStart)} and {formatDate(t.contentWindowEnd)}
      </p>
      {t.guidelines && <p className="mt-3 whitespace-pre-line text-sm text-zinc-700">{t.guidelines}</p>}
      {[...(t.hashtags ?? []), ...(t.mentions ?? [])].length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {[...(t.hashtags ?? []), ...(t.mentions ?? [])].map((tag) => (
            <span key={tag} className="rounded-full bg-cream px-3 py-1 text-xs text-zinc-700">
              {tag}
            </span>
          ))}
        </div>
      )}
    </Card>
  );
}

function Timeline({ deal }: { deal: Deal }) {
  return (
    <Card>
      <SectionTitle title="Timeline" />
      <ol className="relative flex flex-col gap-4 border-l border-zinc-200 pl-5">
        {[...deal.timeline].reverse().map((e, i) => (
          <li key={`${e.type}-${e.occurredAt}-${i}`} className="relative text-sm">
            <span aria-hidden className="absolute -left-[25px] top-1.5 size-2 rounded-full bg-gold" />
            <p className="text-ink">
              {EVENT_LABELS[e.type] ?? e.type}
              {e.actor && <span className="text-zinc-500"> · {e.actor.displayName}</span>}
            </p>
            {typeof e.data?.comment === "string" && <p className="text-zinc-600">&ldquo;{e.data.comment}&rdquo;</p>}
            {typeof e.data?.reason === "string" && <p className="text-zinc-600">{e.data.reason}</p>}
            <p className="text-xs text-zinc-400">{formatDateTime(e.occurredAt)}</p>
          </li>
        ))}
      </ol>
    </Card>
  );
}
