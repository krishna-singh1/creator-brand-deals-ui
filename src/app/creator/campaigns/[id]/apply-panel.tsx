"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { Button, Card, ErrorText, Field, Input, Spinner, StatusBadge, Textarea } from "@/components/ui";
import { api, unwrap } from "@/lib/api/client";
import { type Application, isOpen, STATUS_COPY, suggestedUnitPaise } from "@/lib/applications";
import type { CampaignForCreator } from "@/lib/campaigns";
import { errorMessage } from "@/lib/errors";
import { DELIVERABLE_LABELS, formatPaise, rupeesToPaise } from "@/lib/format";

const MIN_PITCH = 50;

/** Apply with a pitch and a per-deliverable quote, or show the existing application with a withdraw action. */
export function ApplyPanel({ data }: { data: CampaignForCreator }) {
  const queryClient = useQueryClient();
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["campaigns", "public", data.campaign.id] });
    queryClient.invalidateQueries({ queryKey: ["campaigns", "feed"] });
    queryClient.invalidateQueries({ queryKey: ["applications"] });
    queryClient.invalidateQueries({ queryKey: ["creator", "dashboard"] });
  };

  if (data.myApplication) {
    return <ApplicationStatusCard application={data.myApplication} onChange={refresh} />;
  }
  if (!data.eligible) {
    return (
      <Card className="border-amber-200">
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

function ApplyForm({ data, onApplied }: { data: CampaignForCreator; onApplied: () => void }) {
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
    mutationFn: () =>
      unwrap(
        api.POST("/campaigns/{campaignId}/applications", {
          params: { path: { campaignId: data.campaign.id } },
          body: { pitch, quote, availabilityConfirmed: true },
        }),
      ),
    onSuccess: onApplied,
  });

  return (
    <Card className="border-emerald-200">
      <form
        className="flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          apply.mutate();
        }}
      >
        <div>
          <p className="font-display text-2xl text-ink">Apply to this brief</p>
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
            "Send application"
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
    <Card className={a.status === "APPROVED" ? "border-emerald-200" : ""}>
      <div className="flex items-center justify-between gap-3">
        <p className="font-display text-2xl text-ink">Your application</p>
        <StatusBadge status={a.status} />
      </div>
      <p className="mt-2 text-sm text-zinc-600">{STATUS_COPY[a.status]}</p>
      {a.decisionReason && <p className="mt-2 text-sm text-zinc-700">Brand&apos;s note: {a.decisionReason}</p>}
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
