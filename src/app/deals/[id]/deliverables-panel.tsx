"use client";

import { useState } from "react";

import { Button, Card, ErrorText, Field, Input, SectionTitle, StatusBadge, Textarea } from "@/components/ui";
import { api, unwrap } from "@/lib/api/client";
import { type Deal, type DealDeliverable, useInvalidateDeal } from "@/lib/deals";
import { errorMessage } from "@/lib/errors";
import { uploadFile } from "@/lib/upload";
import { DELIVERABLE_LABELS } from "@/lib/format";
import { useMutation } from "@tanstack/react-query";

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
  // Submissions return the submission, not the deal: refetch it, plus the lists and dashboards it shows up in.
  const invalidate = useInvalidateDeal(dealId);
  const refresh = () => invalidate();
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
          {s.screenshots && s.screenshots.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2" aria-label={`Screenshots for ${label}`}>
              {s.screenshots.map((shot, i) => (
                <li key={shot.url}>
                  <a href={shot.url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl ring-1 ring-zinc-200 transition hover:ring-gold">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={shot.url} alt={`Screenshot ${i + 1} of ${s.screenshots!.length}`} className="size-20 object-cover" />
                  </a>
                </li>
              ))}
            </ul>
          )}
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
  const [shots, setShots] = useState<File[]>([]);
  const submit = useMutation({
    mutationFn: async () => {
      const screenshotFileIds = [];
      for (const file of shots) screenshotFileIds.push(await uploadFile("SUBMISSION_SCREENSHOT", file));
      return unwrap(
        api.POST("/deals/{dealId}/deliverables/{deliverableId}/submissions", {
          params: { path: { dealId, deliverableId } },
          body: { postUrl, screenshotFileIds, notes: notes || undefined, disclosureConfirmed: disclosed },
        }),
      );
    },
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
      <Field label="Screenshots (optional, up to 5)" hint="Reach or insights for the post help the brand review it faster.">
        <input
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          className="text-sm"
          onChange={(e) => setShots(Array.from(e.target.files ?? []).slice(0, 5))}
        />
      </Field>
      {shots.length > 0 && <p className="text-xs text-zinc-600">{shots.map((f) => f.name).join(", ")}</p>}
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
