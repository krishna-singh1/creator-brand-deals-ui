"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { CompensationBadge } from "@/components/campaign-bits";
import { Button, Card, ErrorText, Field, PageTitle, Select, Skeleton, StatusBadge, Textarea } from "@/components/ui";
import { api, type components, unwrap } from "@/lib/api/client";
import { DISPUTE_OUTCOMES, DISPUTE_REASONS } from "@/lib/deals";
import { errorMessage } from "@/lib/errors";
import { formatDateTime, formatPaise } from "@/lib/format";

import { useCursorList } from "../admin-bits";
import { AdminShell } from "../admin-shell";

type AdminDispute = components["schemas"]["AdminDispute"];
type Outcome = components["schemas"]["DisputeOutcome"];

const OUTCOME_LABELS: Record<Outcome, string> = {
  RESUME: "Resume the deal where it was",
  COMPLETE: "Mark the deal completed",
  CANCEL: "Cancel the deal (no penalty for either side)",
};

export default function AdminDisputesPage() {
  return (
    <AdminShell>
      <Disputes />
    </AdminShell>
  );
}

function Disputes() {
  const [status, setStatus] = useState<"OPEN" | "RESOLVED" | "">("OPEN");
  const list = useCursorList(["admin", "disputes", status], (cursor) =>
    unwrap(api.GET("/admin/disputes", { params: { query: { status: status || undefined, cursor, limit: 20 } } })),
  );
  return (
    <div className="flex flex-col gap-8">
      <PageTitle eyebrow="Admin" title="Disputes" subtitle="Deals paused because a brand or creator asked BrandDeal to step in. Oldest first.">
        <Select className="w-44" aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
          <option value="OPEN">Open</option>
          <option value="RESOLVED">Resolved</option>
          <option value="">All</option>
        </Select>
      </PageTitle>
      {list.isPending ? (
        <Skeleton className="h-48" />
      ) : list.items.length === 0 ? (
        <Card>
          <p className="text-sm text-zinc-600">{status === "OPEN" ? "No open disputes. Nice." : "Nothing here yet."}</p>
        </Card>
      ) : (
        list.items.map((d) => <DisputeCard key={d.id} dispute={d} />)
      )}
      {list.hasNextPage && (
        <Button variant="secondary" className="self-center" onClick={() => list.fetchNextPage()} disabled={list.isFetchingNextPage}>
          Load more
        </Button>
      )}
    </div>
  );
}

function DisputeCard({ dispute: d }: { dispute: AdminDispute }) {
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-2xl text-ink">{d.deal.campaignTitle}</p>
          <p className="text-sm text-zinc-600">
            {d.deal.brand.brandName} × {d.deal.creator.displayName}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <CompensationBadge type={d.deal.compensationType} />
          <span className="font-display text-xl text-ink">{formatPaise(d.deal.agreedTotalPaise)}</span>
          <StatusBadge status={d.status} />
        </div>
      </div>
      <div className="rounded-2xl bg-cream/60 p-4 text-sm text-zinc-700">
        <p className="font-medium text-ink">
          {d.raisedBy?.displayName ?? "A party"}: {DISPUTE_REASONS[d.reason]}
        </p>
        {d.description && <p className="mt-1 whitespace-pre-line">{d.description}</p>}
        <p className="mt-2 text-xs text-zinc-500">
          Raised {formatDateTime(d.createdAt)}
          {d.statusBeforeDispute ? ` · deal was ${d.statusBeforeDispute.replaceAll("_", " ").toLowerCase()}` : ""}
        </p>
      </div>
      {d.status === "OPEN" ? (
        <ResolveForm dispute={d} />
      ) : (
        <p className="text-sm text-zinc-700">
          Resolved {d.resolvedAt ? formatDateTime(d.resolvedAt) : ""}: {d.outcome ? DISPUTE_OUTCOMES[d.outcome] : ""} {d.resolution}
        </p>
      )}
    </Card>
  );
}

function ResolveForm({ dispute: d }: { dispute: AdminDispute }) {
  const queryClient = useQueryClient();
  const [outcome, setOutcome] = useState<Outcome>("RESUME");
  const [note, setNote] = useState("");
  const resolve = useMutation({
    mutationFn: () =>
      unwrap(api.POST("/admin/disputes/{disputeId}/resolve", { params: { path: { disputeId: d.id } }, body: { outcome, resolution: note.trim() } })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "disputes"] }),
  });
  return (
    <form
      className="grid gap-3 sm:grid-cols-[1fr_2fr]"
      onSubmit={(e) => {
        e.preventDefault();
        resolve.mutate();
      }}
    >
      <Field label="Decision">
        <Select value={outcome} onChange={(e) => setOutcome(e.target.value as Outcome)}>
          {Object.entries(OUTCOME_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Note to both parties" hint="Shown on the deal and emailed. At least 10 characters.">
        <Textarea className="min-h-20" minLength={10} maxLength={2000} required value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
      <div className="flex items-center gap-3 sm:col-span-2">
        <Button type="submit" disabled={note.trim().length < 10 || resolve.isPending}>
          {resolve.isPending ? "Saving…" : "Resolve dispute"}
        </Button>
        <ErrorText>{resolve.isError && errorMessage(resolve.error)}</ErrorText>
      </div>
    </form>
  );
}
