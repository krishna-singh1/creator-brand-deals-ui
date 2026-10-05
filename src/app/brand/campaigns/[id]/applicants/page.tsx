"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { use, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { MatchScore } from "@/components/campaign-bits";
import { LoadError } from "@/components/load-error";
import { Reveal } from "@/components/motion";
import { RequireSession } from "@/components/require-session";
import { Button, Card, ErrorText, Field, Input, PageTitle, Select, Skeleton, StatusBadge } from "@/components/ui";
import { api, unwrap } from "@/lib/api/client";
import { type Applicant, type ApplicationStatus, isOpen, reliability } from "@/lib/applications";
import { errorMessage } from "@/lib/errors";
import { DELIVERABLE_LABELS, formatCount, formatPaise, rupeesToPaise } from "@/lib/format";
import { isVerifiedSource, verifiedSourceLabel } from "@/lib/verification";

import { PRODUCT } from "@/lib/product";

type Sort = "NEWEST" | "MATCH" | "FOLLOWERS" | "ENGAGEMENT" | "PRICE_ASC";

export default function ApplicantsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <RequireSession role="BRAND">
      {(me) => (
        <AppShell me={me}>
          <Applicants campaignId={id} />
        </AppShell>
      )}
    </RequireSession>
  );
}

function Applicants({ campaignId }: { campaignId: string }) {
  const [status, setStatus] = useState<ApplicationStatus | "">("");
  const [sort, setSort] = useState<Sort>("MATCH");
  const { data: campaign } = useQuery({
    queryKey: ["campaigns", campaignId],
    queryFn: () => unwrap(api.GET("/campaigns/{campaignId}", { params: { path: { campaignId } } })),
  });
  const query = useInfiniteQuery({
    queryKey: ["applications", "campaign", campaignId, status, sort],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      unwrap(
        api.GET("/campaigns/{campaignId}/applications", {
          params: { path: { campaignId }, query: { status: status || undefined, sort, cursor: pageParam, limit: 20 } },
        }),
      ),
    getNextPageParam: (last) => last.nextCursor,
  });
  const items = query.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="flex flex-col gap-10">
      <Link href={`/brand/campaigns/${campaignId}`} className="text-sm text-zinc-500 hover:text-ink">
        ← Back to campaign
      </Link>
      <PageTitle
        eyebrow={campaign ? `${campaign.approvedCount}/${campaign.creatorsNeeded} creators approved` : "Applicants"}
        title={campaign?.title ?? "Applicants"}
        subtitle="Compare pitches and quotes. Approving a creator creates the deal and shares contact details."
      />
      <div className="flex flex-wrap items-center gap-3">
        <Select className="w-48" value={status} onChange={(e) => setStatus(e.target.value as ApplicationStatus | "")} aria-label="Status">
          <option value="">All applicants</option>
          <option value="APPLIED">New</option>
          <option value="SHORTLISTED">Shortlisted</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="INVITED">Invited, no reply yet</option>
          <option value="DECLINED">Declined invites</option>
        </Select>
        <Select className="ml-auto w-52" value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort">
          <option value="MATCH">Best match</option>
          <option value="NEWEST">Newest</option>
          <option value="FOLLOWERS">Most followers</option>
          <option value="ENGAGEMENT">Highest engagement</option>
          <option value="PRICE_ASC">Lowest quote</option>
        </Select>
      </div>

      {query.isError && !query.data ? (
        <LoadError error={query.error} backHref={`/brand/campaigns/${campaignId}`} backLabel="Back to campaign" />
      ) : query.isPending ? (
        <div className="grid gap-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      ) : items.length === 0 && status ? (
        <Card className="flex flex-col items-start gap-4">
          <p className="font-display text-2xl text-ink">No applicants match this filter</p>
          <Button variant="secondary" onClick={() => setStatus("")}>
            Show all applicants
          </Button>
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <p className="font-display text-2xl text-ink">No applicants yet</p>
          <p className="mt-2 text-sm text-zinc-600">Verified creators who match your brief can apply until the apply-by date.</p>
        </Card>
      ) : (
        <ul className="flex flex-col gap-5">
          {items.map((a, i) => (
            <Reveal as="li" key={a.id} delay={Math.min(i, 6) * 60}>
              <ApplicantCard applicant={a} campaignId={campaignId} paid={campaign ? campaign.compensationType !== "PRODUCT" : a.quotedTotalPaise > 0} />
            </Reveal>
          ))}
        </ul>
      )}
      {query.hasNextPage && (
        <Button variant="secondary" disabled={query.isFetchingNextPage} onClick={() => query.fetchNextPage()}>
          Load more
        </Button>
      )}
    </div>
  );
}

function ApplicantCard({ applicant: a, campaignId, paid }: { applicant: Applicant; campaignId: string; paid: boolean }) {
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const queryClient = useQueryClient();
  const path = { params: { path: { applicationId: a.id } } };
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["applications", "campaign", campaignId] });
    queryClient.invalidateQueries({ queryKey: ["campaigns", campaignId] });
    queryClient.invalidateQueries({ queryKey: ["brand", "dashboard"] });
  };
  const shortlist = useMutation({ mutationFn: () => unwrap(api.POST("/applications/{applicationId}/shortlist", path)), onSuccess: refresh });
  const reject = useMutation({
    mutationFn: (reason: string) => unwrap(api.POST("/applications/{applicationId}/reject", { ...path, body: { reason: reason || undefined } })),
    onSuccess: () => {
      setRejecting(false);
      refresh();
    },
  });
  const approve = useMutation({
    mutationFn: (agreedTotalPaise?: number) =>
      unwrap(api.POST("/applications/{applicationId}/approve", { ...path, body: { agreedTotalPaise } })),
    onSuccess: () => {
      refresh();
      // Approval creates a deal and changes the campaign's approved count.
      queryClient.invalidateQueries({ queryKey: ["deals", "list"] });
      queryClient.invalidateQueries({ queryKey: ["campaigns", "mine"] });
    },
  });
  // Approve errors show inside the approve form.
  const error = [shortlist, reject].find((m) => m.isError)?.error;
  const c = a.creator;

  return (
    <Card className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          {c.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c.avatarUrl} alt="" className="size-14 rounded-full object-cover ring-2 ring-gold/30" />
          ) : (
            <span className="grid size-14 place-items-center rounded-full bg-ink font-display text-xl text-gold-soft">
              {c.displayName.charAt(0)}
            </span>
          )}
          <div className="flex flex-col gap-1">
            <p className="font-display text-2xl text-ink">{c.displayName}</p>
            <p className="text-sm text-zinc-600">
              @{c.handle} · {formatCount(c.followers)} followers · {c.engagementRate}% engagement
              {c.city ? ` · ${c.city}` : ""}
            </p>
            {isVerifiedSource(c.metricSource) && (
              <span className="text-[11px] uppercase tracking-[0.14em] text-emerald-700">{verifiedSourceLabel(c.metricSource)}</span>
            )}
            <Reliability creator={c} />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <StatusBadge status={a.status} />
          <MatchScore score={a.matchScore} />
        </div>
      </div>

      {a.pitch && <p className="whitespace-pre-line text-[15px] leading-relaxed text-zinc-700">{a.pitch}</p>}

      {a.status === "INVITED" || a.status === "DECLINED" ? (
        <p className="rounded-2xl bg-cream/60 p-4 text-sm text-zinc-700">
          {a.status === "INVITED" ? "You invited them. Waiting for their pitch and quote." : "They declined your invite."}
          {a.inviteMessage ? ` Your note: “${a.inviteMessage}”` : ""}
        </p>
      ) : (
        <div className="grid gap-3 rounded-2xl bg-cream/60 p-4 text-sm sm:grid-cols-[1fr_auto]">
          <ul className="flex flex-col gap-1">
            {a.quote.map((q) => (
              <li key={q.deliverableType} className="text-zinc-700">
                {q.quantity} × {DELIVERABLE_LABELS[q.deliverableType]} at {formatPaise(q.unitPricePaise)}
              </li>
            ))}
          </ul>
          <div className="flex flex-col items-end gap-1">
            <span className="font-display text-2xl text-ink">{formatPaise(a.quotedTotalPaise)}</span>
            {a.suggestedTotal && (
              <span className="text-xs text-zinc-500">
                Market rate {formatPaise(a.suggestedTotal.minPaise)}–{formatPaise(a.suggestedTotal.maxPaise)}
              </span>
            )}
            {a.overBudget && <span className="text-xs font-medium text-amber-800">Above your budget</span>}
          </div>
        </div>
      )}

      {a.decisionReason && <p className="text-sm text-zinc-600">Your note: {a.decisionReason}</p>}
      {a.status === "APPROVED" && a.dealId && (
        <Link href={`/deals/${a.dealId}`} className="link-underline self-start text-sm font-medium text-emerald-800">
          Deal created · Open deal →
        </Link>
      )}

      {isOpen(a.status) && approving && (
        <ApproveForm
          creatorName={c.displayName}
          quotedTotalPaise={a.quotedTotalPaise}
          paid={paid}
          pending={approve.isPending}
          error={approve.error}
          onCancel={() => setApproving(false)}
          onApprove={(agreed) => approve.mutate(agreed === a.quotedTotalPaise ? undefined : agreed)}
        />
      )}

      {isOpen(a.status) && rejecting && (
        <RejectForm
          pending={reject.isPending}
          onCancel={() => {
            setRejecting(false);
            reject.reset();
          }}
          onReject={(reason) => reject.mutate(reason)}
        />
      )}

      {isOpen(a.status) && (
        <div className="flex flex-wrap items-center gap-3">
          {!approving && <Button onClick={() => setApproving(true)}>Approve</Button>}
          {a.status === "APPLIED" && (
            <Button variant="secondary" onClick={() => shortlist.mutate()} disabled={shortlist.isPending}>
              Shortlist
            </Button>
          )}
          {!rejecting && (
            <Button variant="danger" onClick={() => setRejecting(true)}>
              Reject
            </Button>
          )}
          <ErrorText>{error && errorMessage(error)}</ErrorText>
        </div>
      )}
    </Card>
  );
}

/**
 * Confirms an approval. Paid deals need an agreed amount above ₹0 (prefilled with the quote, editable if you
 * negotiated); barter deals have no amount. Approving creates the deal and shares contact details.
 */
function ApproveForm({
  creatorName,
  quotedTotalPaise,
  paid,
  pending,
  error,
  onCancel,
  onApprove,
}: {
  creatorName: string;
  quotedTotalPaise: number;
  paid: boolean;
  pending: boolean;
  error: unknown;
  onCancel: () => void;
  onApprove: (agreedTotalPaise: number) => void;
}) {
  const [rupees, setRupees] = useState(String(quotedTotalPaise / 100));
  const amount = Number(rupees);
  const valid = !paid || (rupees.trim() !== "" && Number.isFinite(amount) && amount > 0);
  return (
    <form
      className="flex flex-col gap-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onApprove(paid ? rupeesToPaise(amount) : 0);
      }}
    >
      <p className="text-sm text-zinc-700">
        Approve <span className="font-medium text-ink">{creatorName}</span>? This creates the deal and shares contact details with both of you.
      </p>
      {paid && (
        <Field label="Agreed amount (₹)" hint={`Their quote: ${formatPaise(quotedTotalPaise)}. Change it only if you agreed a different fee.`}>
          <Input type="number" min={1} step="1" required className="max-w-48" value={rupees} onChange={(e) => setRupees(e.target.value)} autoFocus />
        </Field>
      )}
      {paid && !valid && <ErrorText>Enter an amount above ₹0.</ErrorText>}
      <ErrorText>{error ? errorMessage(error) : null}</ErrorText>
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={!valid || pending}>
          {pending ? "Approving…" : paid ? `Approve at ${valid ? formatPaise(rupeesToPaise(amount)) : "…"}` : "Approve barter deal"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

/** Confirms a rejection, with an optional note the creator sees. */
function RejectForm({ pending, onCancel, onReject }: { pending: boolean; onCancel: () => void; onReject: (reason: string) => void }) {
  const [reason, setReason] = useState("");
  return (
    <form
      className="flex flex-col gap-4 rounded-2xl border border-red-200 bg-red-50/40 p-5"
      onSubmit={(e) => {
        e.preventDefault();
        onReject(reason.trim());
      }}
    >
      <Field label="Note for the creator (optional)" hint="Kind and specific helps them pitch better next time.">
        <Input maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} autoFocus />
      </Field>
      <div className="flex flex-wrap gap-3">
        <Button type="submit" variant="danger" disabled={pending}>
          {pending ? "Rejecting…" : "Confirm reject"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

/** Track record on ExposureStreet, so brands can spot creators who often cancel. */
function Reliability({ creator }: { creator: Applicant["creator"] }) {
  const r = reliability(creator);
  if (r.isNew) return <span className="text-xs text-zinc-500">New to {PRODUCT.name}: no completed deals yet</span>;
  return (
    <span className="flex flex-wrap items-center gap-2 text-xs text-zinc-600">
      {r.completed} deal{r.completed === 1 ? "" : "s"} completed
      {r.cancelled > 0 && ` · ${r.cancelled} cancelled by the creator`}
      {creator.ratingAvg ? ` · ★ ${Number(creator.ratingAvg).toFixed(1)}` : ""}
      {r.oftenCancels && (
        <span className="rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-900 ring-1 ring-amber-200" title="Cancelled 2 or more deals, at least 30% of their deals">
          Often cancels
        </span>
      )}
    </span>
  );
}
