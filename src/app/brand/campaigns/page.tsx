"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { CompensationBadge } from "@/components/campaign-bits";
import { Reveal } from "@/components/motion";
import { RequireSession } from "@/components/require-session";
import { Button, Card, PageTitle, Select, Skeleton, StatusBadge } from "@/components/ui";
import { api, type components, unwrap } from "@/lib/api/client";
import { formatDeadline, formatDeliverables, formatOffer } from "@/lib/campaigns";

type Status = components["schemas"]["CampaignStatus"];

export default function BrandCampaignsPage() {
  return (
    <RequireSession role="BRAND">
      {(me) => (
        <AppShell me={me}>
          <Campaigns />
        </AppShell>
      )}
    </RequireSession>
  );
}

function Campaigns() {
  const [status, setStatus] = useState<Status | "">("");
  const query = useInfiniteQuery({
    queryKey: ["campaigns", "mine", status],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      unwrap(api.GET("/campaigns/mine", { params: { query: { status: status || undefined, cursor: pageParam, limit: 20 } } })),
    getNextPageParam: (last) => last.nextCursor,
  });
  const items = query.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="flex flex-col gap-10">
      <PageTitle eyebrow="Brand suite" title="Campaigns" subtitle="Draft a brief, publish it to verified creators, and close it when you have your line-up.">
        <div className="flex items-center gap-3">
          <Select className="w-40" value={status} onChange={(e) => setStatus(e.target.value as Status | "")} aria-label="Filter by status">
            <option value="">All</option>
            <option value="DRAFT">Drafts</option>
            <option value="PUBLISHED">Published</option>
            <option value="CLOSED">Closed</option>
          </Select>
          <Link
            href="/brand/campaigns/new"
            className="inline-flex h-11 items-center rounded-full bg-ink px-6 text-sm font-medium text-ivory shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift"
          >
            New campaign
          </Link>
        </div>
      </PageTitle>

      {query.isPending ? (
        <div className="grid gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : items.length === 0 ? (
        <Card className="flex flex-col items-start gap-4">
          <p className="font-display text-2xl text-ink">No campaigns yet</p>
          <p className="text-sm text-zinc-600">Your first brief takes about five minutes. You can save it as a draft and publish when ready.</p>
          <Link href="/brand/campaigns/new" className="link-underline text-sm font-medium text-ink">
            Write your first brief →
          </Link>
        </Card>
      ) : (
        <ul className="flex flex-col gap-4">
          {items.map((c, i) => (
            <Reveal as="li" key={c.id} delay={Math.min(i, 6) * 60}>
              <Link href={`/brand/campaigns/${c.id}`} className="block">
                <Card interactive className="flex flex-wrap items-center justify-between gap-4 p-6">
                  <div className="flex min-w-0 flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <StatusBadge status={c.status} />
                      <CompensationBadge type={c.compensationType} />
                    </div>
                    <p className="truncate font-display text-2xl tracking-tight text-ink">{c.title}</p>
                    <p className="text-sm text-zinc-600">
                      {formatDeliverables(c.deliverables)} · {formatOffer(c)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 text-sm">
                    <span className="text-zinc-500">{c.status === "PUBLISHED" ? formatDeadline(c.applyBy) : `Apply by ${c.applyBy}`}</span>
                    <span className="text-ink">
                      {c.applicationCount} applications · {c.approvedCount}/{c.creatorsNeeded} creators
                    </span>
                  </div>
                </Card>
              </Link>
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
