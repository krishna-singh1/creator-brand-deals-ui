"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import { Button, Card, ErrorText, Field, Input, Spinner, StatusBadge, Textarea } from "@/components/ui";
import { api, unwrap } from "@/lib/api/client";
import { type Application, isOpen, STATUS_COPY, suggestedUnitPaise } from "@/lib/applications";
import type { CampaignForCreator } from "@/lib/campaigns";
import { errorMessage } from "@/lib/errors";
import { DELIVERABLE_LABELS, formatPaise, rupeesToPaise } from "@/lib/format";

const MIN_PITCH = 50;

/**
 * Apply with a pitch and a per-deliverable quote, or show the existing application with a withdraw action. An invite
 * from the brand shows their note and the same form (sent as an acceptance, without the audience filters) plus decline.
 */
export function ApplyPanel({ data }: { data: CampaignForCreator }) {
  const queryClient = useQueryClient();
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["campaigns", "public", data.campaign.id] });
    queryClient.invalidateQueries({ queryKey: ["campaigns", "feed"] });
    queryClient.invalidateQueries({ queryKey: ["applications"] });
    queryClient.invalidateQueries({ queryKey: ["creator", "dashboard"] });
  };

  if (data.myApplication?.status === "INVITED") {
    return <InviteCard data={data} invite={data.myApplication} onChange={refresh} />;
  }
  if (data.myApplication) {
    return <ApplicationStatusCard application={data.myApplication} onChange={refresh} />;
  }
  if (!data.eligible) {
    return (
      <Card tone="warning">
        <p className="font-display text-2xl text-ink">Not eligible yet</p>
        <ul className="mt-3 flex flex-col gap-2 text-sm text-zinc-700">
          {(data.ineligibleReasons ?? []).map((r) => (
            <li key={r} className="flex items-start gap-2">
              <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-500" />
              {r}
            </li>
          ))}
        </ul>
      </Card>
    );
  }
  return <ApplyForm data={data} onApplied={refresh} />;
}

function InviteCard({ data, invite, onChange }: { data: CampaignForCreator; invite: Application; onChange: () => void }) {
  const decline = useMutation({
    mutationFn: () => unwrap(api.POST("/applications/{applicationId}/decline-invite", { params: { path: { applicationId: invite.id } } })),
    onSuccess: onChange,
  });
  return (
    <div className="flex flex-col gap-4">
      <Card tone="highlight">
        <div className="flex items-center justify-between gap-3">
          <p className="font-display text-2xl text-ink">{data.campaign.brand.brandName} invited you</p>
          <StatusBadge status="INVITED" />
        </div>
        {invite.inviteMessage && <p className="mt-2 whitespace-pre-line text-sm text-zinc-700">&ldquo;{invite.inviteMessage}&rdquo;</p>}
        <p className="mt-2 text-sm text-zinc-600">Send your pitch and quote below to join, or decline if it isn&apos;t for you.</p>
        <ErrorText>{decline.isError && errorMessage(decline.error)}</ErrorText>
        <Button
          variant="ghost"
          className="mt-3"
          disabled={decline.isPending}
          onClick={() => window.confirm("Decline this invite? The brand will be told.") && decline.mutate()}
        >
          Decline invite
        </Button>
      </Card>
      <ApplyForm data={data} onApplied={onChange} inviteId={invite.id} />
    </div>
  );
}

function ApplyForm({ data, onApplied, inviteId }: { data: CampaignForCreator; onApplied: () => void; inviteId?: string }) {
  const barter = data.campaign.compensationType === "PRODUCT";
  const [pitch, setPitch] = useState("");
  const [available, setAvailable] = useState(false);
  const [prices, setPrices] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      data.campaign.deliverables.map((d) => {
        const suggestion = data.suggestedQuote.find((s) => s.deliverableType === d.deliverableType);
        return [d.deliverableType, barter ? "0" : suggestion ? String(suggestedUnitPaise(suggestion) / 100) : ""];
      }),
    ),
  );
  const quote = data.campaign.deliverables.map((d) => ({
    deliverableType: d.deliverableType,
    quantity: d.quantity,
    unitPricePaise: rupeesToPaise(Number(prices[d.deliverableType] || 0)),
  }));
  const total = quote.reduce((sum, q) => sum + q.unitPricePaise * q.quantity, 0);
  const budget = data.campaign.budgetMaxPaise ?? data.campaign.budgetMinPaise;

  const apply = useMutation({
    mutationFn: () => {
      const body = { pitch, quote, availabilityConfirmed: true as const };
      return inviteId
        ? unwrap(api.POST("/applications/{applicationId}/accept-invite", { params: { path: { applicationId: inviteId } }, body }))
        : unwrap(api.POST("/campaigns/{campaignId}/applications", { params: { path: { campaignId: data.campaign.id } }, body }));
    },
    onSuccess: onApplied,
  });

  return (
    <Card tone="success">
      <form
        className="flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          apply.mutate();
        }}
      >
        <div>
          <p className="font-display text-2xl text-ink">{inviteId ? "Accept with your pitch" : "Apply to this brief"}</p>
          <p className="mt-1 text-sm text-zinc-600">Tell the brand why you&apos;re the right creator, and name your price.</p>
        </div>
        <Field label="Your pitch" hint={`Your idea, your audience, why it fits. ${pitch.trim().length} characters (${MIN_PITCH} minimum).`}>
          <Textarea required minLength={MIN_PITCH} maxLength={2000} value={pitch} onChange={(e) => setPitch(e.target.value)} />
        </Field>
        {!barter && (
          <div className="flex flex-col gap-3">
            {data.campaign.deliverables.map((d) => (
              <Field key={d.deliverableType} label={`${DELIVERABLE_LABELS[d.deliverableType]} (₹ each, ×${d.quantity})`}>
                <Input
                  type="number"
                  min={0}
                  step={100}
                  required
                  value={prices[d.deliverableType]}
                  onChange={(e) => setPrices((p) => ({ ...p, [d.deliverableType]: e.target.value }))}
                />
              </Field>
            ))}
            <p className="flex items-center justify-between border-t border-zinc-100 pt-3 text-sm">
              <span className="text-zinc-600">Your quote</span>
              <span className="font-display text-xl text-ink">{formatPaise(total)}</span>
            </p>
            {budget != null && total > budget && (
              <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Above the brand&apos;s budget of {formatPaise(budget)}. You can still apply; the brand will see it flagged.
              </p>
            )}
          </div>
        )}
        <label className="flex items-start gap-3 text-sm text-zinc-700">
          <input type="checkbox" className="mt-0.5 size-4 accent-ink" checked={available} onChange={(e) => setAvailable(e.target.checked)} />
          I can deliver within the content window and will disclose the collaboration (#ad).
        </label>
        <ErrorText>{apply.isError && errorMessage(apply.error)}</ErrorText>
        <Button type="submit" className="h-12" disabled={!available || pitch.trim().length < MIN_PITCH || apply.isPending}>
          {apply.isPending ? (
            <>
              <Spinner /> Sending…
            </>
          ) : (
            inviteId ? "Accept invite and send" : "Send application"
          )}
        </Button>
      </form>
    </Card>
  );
}

function ApplicationStatusCard({ application: a, onChange }: { application: Application; onChange: () => void }) {
  const withdraw = useMutation({
    mutationFn: () => unwrap(api.POST("/applications/{applicationId}/withdraw", { params: { path: { applicationId: a.id } } })),
    onSuccess: onChange,
  });
  return (
    <Card tone={a.status === "APPROVED" ? "success" : "default"}>
      <div className="flex items-center justify-between gap-3">
        <p className="font-display text-2xl text-ink">Your application</p>
        <StatusBadge status={a.status} />
      </div>
      <p className="mt-2 text-sm text-zinc-600">{STATUS_COPY[a.status]}</p>
      {a.decisionReason && <p className="mt-2 text-sm text-zinc-700">Brand&apos;s note: {a.decisionReason}</p>}
      {a.dealId && (
        <Link href={`/deals/${a.dealId}`} className="link-underline mt-3 inline-block text-sm font-medium text-emerald-800">
          Open your deal →
        </Link>
      )}
      <p className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3 text-sm">
        <span className="text-zinc-600">Your quote</span>
        <span className="font-display text-xl text-ink">{formatPaise(a.quotedTotalPaise)}</span>
      </p>
      {isOpen(a.status) && (
        <>
          <ErrorText>{withdraw.isError && errorMessage(withdraw.error)}</ErrorText>
          <Button
            variant="secondary"
            className="mt-4"
            disabled={withdraw.isPending}
            onClick={() => window.confirm("Withdraw your application? You can't apply again to this campaign.") && withdraw.mutate()}
          >
            Withdraw application
          </Button>
        </>
      )}
    </Card>
  );
}
