"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { use } from "react";

import { AppShell } from "@/components/app-shell";
import { BrandLine, CompensationBadge } from "@/components/campaign-bits";
import { LoadError } from "@/components/load-error";
import { ContentSkeleton, RequireSession } from "@/components/require-session";
import { Card, PageTitle, SectionTitle, StatusBadge } from "@/components/ui";
import { api, unwrap } from "@/lib/api/client";
import { formatDate } from "@/lib/campaigns";
import { CANCELLABLE, type Deal, dealKey, dealSteps, DISPUTABLE, formatDealValue, isYourMove, NEXT_ACTION_COPY } from "@/lib/deals";
import { DELIVERABLE_LABELS, formatDateTime } from "@/lib/format";

import { PRODUCT } from "@/lib/product";
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
  DISPUTE_RAISED: `Issue reported to ${PRODUCT.name}`,
  DISPUTE_RESOLVED: `Issue resolved by ${PRODUCT.name}`,
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
  const { data: deal, error } = useQuery({
    queryKey: dealKey(id),
    queryFn: () => unwrap(api.GET("/deals/{dealId}", { params: { path: { dealId: id } } })),
    // Pick up the other side's moves (content approved, payment recorded) while the page is open.
    refetchInterval: 30_000,
  });
  if (error && !deal) return <LoadError error={error} backHref="/deals" backLabel="Back to deals" />;
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
          <span className="font-display text-2xl text-ink">{formatDealValue(deal)}</span>
        </div>
      </PageTitle>
      <div className="-mt-4 flex flex-wrap items-center justify-between gap-3">
        {!isBrand ? <BrandLine brand={deal.brand} /> : <span />}
        <a href="#messages" className="link-underline text-sm text-zinc-600 hover:text-ink lg:hidden">
          Message {partnerName} ↓
        </a>
      </div>

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
          <NextStep deal={deal} title={next.title} body={next.body} />
        )
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="flex flex-col gap-6">
          {hasProduct && (
            <section id="shipment" className="scroll-mt-24">
              <ShipmentPanel deal={deal} isBrand={isBrand} />
            </section>
          )}
          <section id="content" className="scroll-mt-24">
            <DeliverablesPanel deal={deal} isBrand={isBrand} canSubmit={canSubmit} />
          </section>
          {hasPayment && (
            <section id="payment" className="scroll-mt-24">
              <PaymentPanel deal={deal} isBrand={isBrand} />
            </section>
          )}
          {deal.status === "COMPLETED" && (
            <section id="review" className="scroll-mt-24">
              <ReviewPanel deal={deal} partnerName={partnerName} />
            </section>
          )}
          {CANCELLABLE.includes(deal.status) && nothingSubmitted && <CancelDeal deal={deal} />}
          {DISPUTABLE.includes(deal.status) && <ReportProblem deal={deal} />}
        </div>
        <div className="flex flex-col gap-6">
          <section id="messages" className="scroll-mt-24">
            <MessagesPanel dealId={deal.id} meId={meId} partnerName={partnerName} readOnly={deal.status === "CANCELLED"} />
          </section>
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

/** Where each next action is done on the page. Labels say "Go to …" so they never repeat the form's own button. */
const ACTION_TARGET: Record<string, { anchor: string; label: string }> = {
  SHIP_PRODUCT: { anchor: "shipment", label: "Go to shipping" },
  CONFIRM_PRODUCT_RECEIVED: { anchor: "shipment", label: "Go to delivery" },
  SUBMIT_CONTENT: { anchor: "content", label: "Go to your post" },
  REVIEW_SUBMISSION: { anchor: "content", label: "Go to content" },
  MARK_PAID: { anchor: "payment", label: "Go to payment" },
  CONFIRM_PAYMENT: { anchor: "payment", label: "Go to payment" },
  LEAVE_REVIEW: { anchor: "review", label: "Go to rating" },
};

/** The banner for whoever's turn it is, with a button that jumps to (and focuses) the form that does it. */
function NextStep({ deal, title, body }: { deal: Deal; title: string; body: string }) {
  const target = deal.nextAction ? ACTION_TARGET[deal.nextAction] : undefined;
  const yourMove = isYourMove(deal);
  const due =
    deal.nextAction === "SUBMIT_CONTENT" ? `Go live by ${formatDate(deal.terms.contentWindowEnd)}` : undefined;
  const jump = () => {
    const el = target && document.getElementById(target.anchor);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    el.querySelector<HTMLElement>("input, textarea, select, button")?.focus({ preventScroll: true });
  };
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-5 rounded-3xl p-7 ${
        yourMove ? "noir-panel grain shadow-noir" : "border border-zinc-200/80 bg-white/85 shadow-soft"
      }`}
    >
      <div className="flex max-w-xl flex-col gap-1.5">
        <p className={`text-[11px] uppercase tracking-[0.24em] ${yourMove ? "text-gold-soft" : "text-gold-deep"}`}>
          {yourMove ? "Your move" : "Their move"}
        </p>
        <p className={`font-display text-2xl ${yourMove ? "text-ivory" : "text-ink"}`}>{title}</p>
        <p className={`text-sm ${yourMove ? "text-ivory/75" : "text-zinc-700"}`}>
          {body}
          {due && <span className={`ml-1 font-medium ${yourMove ? "text-gold-soft" : "text-ink"}`}>{due}.</span>}
        </p>
      </div>
      {yourMove && target && (
        <button
          type="button"
          onClick={jump}
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-gold px-6 text-sm font-medium text-ink transition-all duration-300 hover:-translate-y-0.5 hover:bg-gold-soft hover:shadow-gold"
        >
          {target.label} <span aria-hidden>↓</span>
        </button>
      )}
    </div>
  );
}

/** Statuses that mean "this step is under way" rather than "this step is done". */
const IN_PROGRESS_STEPS = new Set(["IN_PROGRESS", "UNDER_REVIEW"]);

function Progress({ deal }: { deal: Deal }) {
  const steps = dealSteps(deal);
  const at = steps.findIndex((s) => s.key === deal.status);
  // Steps up to the reached milestone are done; the one after it (or the step under way) is current.
  const doneCount =
    deal.status === "COMPLETED" ? steps.length : at < 0 ? 1 : IN_PROGRESS_STEPS.has(deal.status) ? at : at + 1;
  const current = Math.min(doneCount, steps.length - 1);
  const pct = deal.status === "COMPLETED" ? 100 : Math.round((doneCount / (steps.length - 1)) * 100);
  return (
    <div aria-label="Deal progress">
      {/* Phones: one line of text and a bar. */}
      <div className="flex flex-col gap-2 sm:hidden">
        <p className="text-sm text-zinc-600">
          {deal.status === "COMPLETED" ? (
            <span className="text-ink">All done</span>
          ) : (
            <>
              Step {current + 1} of {steps.length} · <span className="font-medium text-ink">{steps[current].label}</span>
            </>
          )}
        </p>
        <div className="h-1.5 overflow-hidden rounded-full bg-cream" aria-hidden>
          <div className="h-full rounded-full bg-gradient-to-r from-gold-deep to-gold" style={{ width: `${Math.min(100, pct)}%` }} />
        </div>
      </div>
      {/* Larger screens: the full stepper on one line. */}
      <ol className="hidden items-start sm:flex">
        {steps.map((s, i) => {
          const done = i < doneCount;
          const isCurrent = i === current && deal.status !== "COMPLETED";
          return (
            <li key={s.key} className="relative flex flex-1 flex-col items-center gap-2 text-center">
              {i > 0 && (
                // From the previous circle's edge to this one's, with a small gap: never drawn under a number.
                <span
                  aria-hidden
                  className={`absolute top-3.5 h-px ${i <= doneCount - 1 || isCurrent ? "bg-gold" : "bg-zinc-300"}`}
                  style={{ left: "calc(-50% + 1.375rem)", right: "calc(50% + 1.375rem)" }}
                />
              )}
              <span
                aria-current={isCurrent ? "step" : undefined}
                className={`relative z-10 grid size-7 place-items-center rounded-full text-xs font-medium transition-colors ${
                  done ? "bg-ink text-gold-soft" : isCurrent ? "bg-gold text-ink ring-4 ring-gold/20" : "border border-zinc-300 bg-ivory text-zinc-400"
                }`}
              >
                {done ? "✓" : i + 1}
              </span>
              <span className={`text-xs tracking-wide ${done || isCurrent ? "text-ink" : "text-zinc-400"}`}>{s.label}</span>
            </li>
          );
        })}
      </ol>
    </div>
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
