"use client";

import { useState } from "react";

import { Button, Card, ErrorText, Field, Input, SectionTitle, StatusBadge, Textarea } from "@/components/ui";
import { api, unwrap } from "@/lib/api/client";
import { type Deal, type DealDeliverable, dealKey } from "@/lib/deals";
import { errorMessage } from "@/lib/errors";
import { DELIVERABLE_LABELS } from "@/lib/format";
import { useMutation, useQueryClient } from "@tanstack/react-query";

/** Each piece of content owed: creators submit live links, brands approve or request changes. */
export function DeliverablesPanel({ deal, isBrand, canSubmit }: { deal: Deal; isBrand: boolean; canSubmit: boolean }) {
  return (
    <Card>
      <SectionTitle title="Content" subtitle="One live post per deliverable. The brand reviews each one." />
      <ul className="flex flex-col divide-y divide-zinc-100">
        {deal.deliverables.map((d) => (
          <li key={d.id} className="py-5 first:pt-0 last:pb-0">
            <DeliverableRow dealId={deal.id} deliverable={d} isBrand={isBrand} canSubmit={canSubmit} />
          </li>
        ))}
      </ul>
    </Card>
  );
}

function DeliverableRow({ dealId, deliverable: d, isBrand, canSubmit }: { dealId: string; deliverable: DealDeliverable; isBrand: boolean; canSubmit: boolean }) {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: dealKey(dealId) });
  const s = d.latestSubmission;
  const label = `${DELIVERABLE_LABELS[d.deliverableType]} #${d.seq}`;
  const needsSubmission = d.status === "PENDING" || d.status === "CHANGES_REQUESTED";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="font-medium text-ink">{label}</span>
        <span className="flex items-center gap-2">
          {d.revisionCount > 0 && <span className="text-xs text-zinc-500">{d.revisionCount} revision{d.revisionCount > 1 ? "s" : ""}</span>}
          <StatusBadge status={d.status} />
        </span>
      </div>
      {s && (
        <div className="rounded-2xl bg-cream/60 px-4 py-3 text-sm">
          <a href={s.postUrl} target="_blank" rel="noreferrer" className="link-underline break-all text-ink">
            {s.postUrl}
          </a>
          {s.notes && <p className="mt-1 text-zinc-600">{s.notes}</p>}
          {s.reviewComment && <p className="mt-2 text-amber-900">Brand&apos;s note: {s.reviewComment}</p>}
        </div>
      )}
      {!isBrand && canSubmit && needsSubmission && <SubmitForm dealId={dealId} deliverableId={d.id} label={label} onDone={refresh} />}
      {isBrand && s && s.reviewStatus === "PENDING" && <ReviewActions submissionId={s.id} label={label} onDone={refresh} />}
    </div>
  );
}

function SubmitForm({ dealId, deliverableId, label, onDone }: { dealId: string; deliverableId: string; label: string; onDone: () => void }) {
  const [postUrl, setPostUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [disclosed, setDisclosed] = useState(false);
  const submit = useMutation({
    mutationFn: () =>
      unwrap(
        api.POST("/deals/{dealId}/deliverables/{deliverableId}/submissions", {
          params: { path: { dealId, deliverableId } },
          body: { postUrl, notes: notes || undefined, disclosureConfirmed: disclosed },
        }),
      ),
    onSuccess: onDone,
  });
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        submit.mutate();
      }}
    >
      <Field label={`Live post link for ${label}`}>
        <Input type="url" required placeholder="https://www.instagram.com/reel/…" value={postUrl} onChange={(e) => setPostUrl(e.target.value)} />
      </Field>
      <Field label="Notes (optional)">
        <Textarea className="min-h-20" maxLength={1000} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
      <label className="flex items-start gap-3 text-sm text-zinc-700">
        <input type="checkbox" className="mt-0.5 size-4 accent-ink" checked={disclosed} onChange={(e) => setDisclosed(e.target.checked)} />
        The post clearly discloses the collaboration (#ad or &quot;Paid partnership&quot;), as ASCI requires.
      </label>
      <ErrorText>{submit.isError && errorMessage(submit.error)}</ErrorText>
      <Button type="submit" className="self-start" disabled={!disclosed || !postUrl || submit.isPending}>
        {submit.isPending ? "Submitting…" : "Submit for review"}
      </Button>
    </form>
  );
}

function ReviewActions({ submissionId, label, onDone }: { submissionId: string; label: string; onDone: () => void }) {
  const [comment, setComment] = useState("");
  const [asking, setAsking] = useState(false);
  const path = { params: { path: { submissionId } } };
  const approve = useMutation({ mutationFn: () => unwrap(api.POST("/submissions/{submissionId}/approve", path)), onSuccess: onDone });
  const changes = useMutation({
    mutationFn: () => unwrap(api.POST("/submissions/{submissionId}/request-changes", { ...path, body: { comment } })),
    onSuccess: onDone,
  });
  const error = approve.error ?? changes.error;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => approve.mutate()} disabled={approve.isPending} aria-label={`Approve ${label}`}>
          Approve
        </Button>
        <Button variant="secondary" onClick={() => setAsking((a) => !a)}>
          Request changes
        </Button>
      </div>
      {asking && (
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            changes.mutate();
          }}
        >
          <Field label="What should change?">
            <Textarea className="min-h-20" required minLength={3} maxLength={1000} value={comment} onChange={(e) => setComment(e.target.value)} />
          </Field>
          <Button type="submit" variant="secondary" className="self-start" disabled={comment.trim().length < 3 || changes.isPending}>
            Send to creator
          </Button>
        </form>
      )}
      <ErrorText>{error && errorMessage(error)}</ErrorText>
    </div>
  );
}
