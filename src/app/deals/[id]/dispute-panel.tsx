"use client";

import { useState } from "react";

import { Button, Card, ErrorText, Field, Select, Textarea } from "@/components/ui";
import { api, unwrap } from "@/lib/api/client";
import { type Deal, DISPUTE_OUTCOMES, DISPUTE_REASONS, type DisputeReason, useDealAction } from "@/lib/deals";
import { errorMessage } from "@/lib/errors";
import { formatDateTime } from "@/lib/format";

import { PRODUCT } from "@/lib/product";

const MIN = 20;

/** While disputed: what was raised. After resolution: ExposureStreet's decision. */
export function DisputeBanner({ deal }: { deal: Deal }) {
  const d = deal.dispute;
  if (!d) return null;
  if (d.status === "OPEN") {
    return (
      <Card tone="warning">
        <p className="font-display text-2xl text-ink">Paused: {PRODUCT.name} is looking into an issue</p>
        <p className="mt-1 text-sm text-zinc-700">
          {d.raisedBy?.displayName ?? "A party"} reported: {DISPUTE_REASONS[d.reason]}. Deal steps are paused until our team
          resolves it; you can still message each other below.
        </p>
        {d.description && <p className="mt-3 whitespace-pre-line rounded-2xl bg-white/70 p-4 text-sm text-zinc-700">&ldquo;{d.description}&rdquo;</p>}
        <p className="mt-2 text-xs text-zinc-500">Raised {formatDateTime(d.createdAt)}</p>
      </Card>
    );
  }
  return (
    <Card>
      <p className="font-display text-xl text-ink">Issue resolved by {PRODUCT.name}</p>
      <p className="mt-1 text-sm text-zinc-700">
        {d.outcome ? DISPUTE_OUTCOMES[d.outcome] : ""} {d.resolution}
      </p>
    </Card>
  );
}

/** Either party can ask ExposureStreet to step in while the deal is in progress. */
export function ReportProblem({ deal }: { deal: Deal }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<DisputeReason>("OTHER");
  const [description, setDescription] = useState("");
  const raise = useDealAction(deal.id, async () => {
    await unwrap(api.POST("/deals/{dealId}/disputes", { params: { path: { dealId: deal.id } }, body: { reason, description: description.trim() } }));
    return unwrap(api.GET("/deals/{dealId}", { params: { path: { dealId: deal.id } } }));
  });

  if (!open) {
    return (
      <button type="button" className="self-start text-sm text-zinc-500 underline-offset-4 hover:text-ink hover:underline" onClick={() => setOpen(true)}>
        Report a problem to {PRODUCT.name}
      </button>
    );
  }
  return (
    <Card>
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          raise.mutate();
        }}
      >
        <div>
          <p className="font-display text-2xl text-ink">Report a problem</p>
          <p className="mt-1 text-sm text-zinc-600">
            Our team reviews it and decides how the deal continues. The deal pauses until then, and the other side is told.
          </p>
        </div>
        <Field label="What went wrong">
          <Select value={reason} onChange={(e) => setReason(e.target.value as DisputeReason)}>
            {Object.entries(DISPUTE_REASONS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Details" hint={`What happened, and what you've tried. ${description.trim().length} characters (${MIN} minimum).`}>
          <Textarea required minLength={MIN} maxLength={2000} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <ErrorText>{raise.isError && errorMessage(raise.error)}</ErrorText>
        <div className="flex flex-wrap gap-3">
          <Button type="submit" variant="danger" disabled={description.trim().length < MIN || raise.isPending}>
            {raise.isPending ? "Sending…" : `Send to ${PRODUCT.name}`}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
