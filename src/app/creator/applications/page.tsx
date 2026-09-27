"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { BrandLine } from "@/components/campaign-bits";
import { Reveal } from "@/components/motion";
import { RequireSession } from "@/components/require-session";
import { Button, Card, PageTitle, Select, Skeleton, StatusBadge } from "@/components/ui";
import { api, unwrap } from "@/lib/api/client";
import { type ApplicationStatus, STATUS_COPY } from "@/lib/applications";
import { formatDeliverables } from "@/lib/campaigns";
import { formatPaise } from "@/lib/format";

export default function CreatorApplicationsPage() {
  return (
    <RequireSession role="CREATOR">
      {(me) => (
        <AppShell me={me}>
          <Applications />
        </AppShell>
      )}
    </RequireSession>
  );
}

function Applications() {
  const [status, setStatus] = useState<ApplicationStatus | "">("");
  const query = useInfiniteQuery({
    queryKey: ["applications", "mine", status],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      unwrap(api.GET("/creator/applications", { params: { query: { status: status || undefined, cursor: pageParam, limit: 20 } } })),
    getNextPageParam: (last) => last.nextCursor,
  });
  const items = query.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="flex flex-col gap-10">
      <PageTitle eyebrow="Applications" title="Your pitches" subtitle="Everything you've applied to, and where each one stands.">
        <Select className="w-48" value={status} onChange={(e) => setStatus(e.target.value as ApplicationStatus | "")} aria-label="Filter by status">
          <option value="">All</option>
          <option value="APPLIED">Applied</option>
          <option value="SHORTLISTED">Shortlisted</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Not selected</option>
        </Select>
      </PageTitle>

      {query.isPending ? (
        <div className="grid gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : items.length === 0 ? (
        <Card className="flex flex-col items-start gap-4">
          <p className="font-display text-2xl text-ink">No applications yet</p>
          <p className="text-sm text-zinc-600">Find a brief you love and send your first pitch.</p>
          <Link href="/creator/campaigns" className="link-underline text-sm font-medium text-ink">
            Browse campaigns →
          </Link>
        </Card>
      ) : (
        <ul className="flex flex-col gap-4">
          {items.map((a, i) => (
            <Reveal as="li" key={a.id} delay={Math.min(i, 6) * 60}>
              <Link href={`/creator/campaigns/${a.campaign.id}`} className="block">
                <Card interactive className="flex flex-wrap items-center justify-between gap-4 p-6">
                  <div className="flex min-w-0 flex-col gap-2">
                    <BrandLine brand={a.campaign.brand} />
                    <p className="truncate font-display text-2xl tracking-tight text-ink">{a.campaign.title}</p>
                    <p className="text-sm text-zinc-600">{formatDeliverables(a.campaign.deliverables)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 text-sm">
                    <StatusBadge status={a.status} />
                    <span className="text-zinc-600">{STATUS_COPY[a.status]}</span>
                    <span className="font-medium text-ink">{formatPaise(a.quotedTotalPaise)}</span>
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
