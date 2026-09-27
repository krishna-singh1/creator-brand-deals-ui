"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { use, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { MatchScore } from "@/components/campaign-bits";
import { Reveal } from "@/components/motion";
import { RequireSession } from "@/components/require-session";
import { Button, Card, ErrorText, PageTitle, Select, Skeleton, StatusBadge } from "@/components/ui";
import { api, unwrap } from "@/lib/api/client";
import { type Applicant, type ApplicationStatus, isOpen } from "@/lib/applications";
import { errorMessage } from "@/lib/errors";
import { DELIVERABLE_LABELS, formatCount, formatPaise, rupeesToPaise } from "@/lib/format";

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
        </Select>
        <Select className="ml-auto w-52" value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort">
          <option value="MATCH">Best match</option>
          <option value="NEWEST">Newest</option>
          <option value="FOLLOWERS">Most followers</option>
          <option value="ENGAGEMENT">Highest engagement</option>
          <option value="PRICE_ASC">Lowest quote</option>
        </Select>
      </div>

      {query.isPending ? (
        <div className="grid gap-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      ) : items.length === 0 ? (
        <Card>
          <p className="font-display text-2xl text-ink">No applicants yet</p>
          <p className="mt-2 text-sm text-zinc-600">Verified creators who match your brief can apply until the apply-by date.</p>
        </Card>
      ) : (
        <ul className="flex flex-col gap-5">
          {items.map((a, i) => (
            <Reveal as="li" key={a.id} delay={Math.min(i, 6) * 60}>
              <ApplicantCard applicant={a} campaignId={campaignId} />
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

function ApplicantCard({ applicant: a, campaignId }: { applicant: Applicant; campaignId: string }) {
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
    onSuccess: refresh,
  });
  const approve = useMutation({
    mutationFn: (agreedTotalPaise?: number) =>
      unwrap(api.POST("/applications/{applicationId}/approve", { ...path, body: { agreedTotalPaise } })),
    onSuccess: refresh,
  });
  const error = [shortlist, reject, approve].find((m) => m.isError)?.error;
  const c = a.creator;

  const onApprove = () => {
    const input = window.prompt(
      `Approve ${c.displayName}? This creates the deal and shares contact details.\n\nAgreed amount in ₹ (leave as is to accept the quote):`,
      String(a.quotedTotalPaise / 100),
    );
    if (input === null) return;
    const agreed = rupeesToPaise(Number(input));
    approve.mutate(agreed === a.quotedTotalPaise ? undefined : agreed);
  };

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
            {c.metricSource === "ADMIN_VERIFIED" && (
              <span className="text-[11px] uppercase tracking-[0.14em] text-emerald-700">Metrics verified by BrandDeal</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <StatusBadge status={a.status} />
          <MatchScore score={a.matchScore} />
        </div>
      </div>

      {a.pitch && <p className="whitespace-pre-line text-[15px] leading-relaxed text-zinc-700">{a.pitch}</p>}

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

      {a.decisionReason && <p className="text-sm text-zinc-600">Your note: {a.decisionReason}</p>}
      {a.status === "APPROVED" && a.dealId && (
        <Link href={`/deals/${a.dealId}`} className="link-underline self-start text-sm font-medium text-emerald-800">
          Deal created · Open deal →
        </Link>
      )}

      {isOpen(a.status) && (
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={onApprove} disabled={approve.isPending}>
            {approve.isPending ? "Approving…" : "Approve"}
          </Button>
          {a.status === "APPLIED" && (
            <Button variant="secondary" onClick={() => shortlist.mutate()} disabled={shortlist.isPending}>
              Shortlist
            </Button>
          )}
          <Button
            variant="danger"
            disabled={reject.isPending}
            onClick={() => {
              const reason = window.prompt("Reject this application? Add an optional note for the creator:", "");
              if (reason !== null) reject.mutate(reason);
            }}
          >
            Reject
          </Button>
          <ErrorText>{error && errorMessage(error)}</ErrorText>
        </div>
      )}
    </Card>
  );
}
