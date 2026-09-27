"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { BrandLine, CompensationBadge } from "@/components/campaign-bits";
import { Reveal } from "@/components/motion";
import { RequireSession } from "@/components/require-session";
import { Button, Card, PageTitle, Select, Skeleton, StatusBadge } from "@/components/ui";
import { api, unwrap } from "@/lib/api/client";
import { type DealStatus, NEXT_ACTION_COPY } from "@/lib/deals";
import { formatPaise } from "@/lib/format";

export default function DealsPage() {
  return (
    <RequireSession>
      {(me) => (
        <AppShell me={me}>
          <Deals isBrand={me.role === "BRAND"} />
        </AppShell>
      )}
    </RequireSession>
  );
}

function Deals({ isBrand }: { isBrand: boolean }) {
  const [status, setStatus] = useState<DealStatus | "">("");
  const query = useInfiniteQuery({
    queryKey: ["deals", "list", status],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      unwrap(api.GET("/deals", { params: { query: { status: status || undefined, cursor: pageParam, limit: 20 } } })),
    getNextPageParam: (last) => last.nextCursor,
  });
  const items = query.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="flex flex-col gap-10">
      <PageTitle
        eyebrow="Deals"
        title={isBrand ? "Your collaborations" : "Your deals"}
        subtitle="Every approved collaboration, from product shipping to content, payment and ratings."
      >
        <Select className="w-48" value={status} onChange={(e) => setStatus(e.target.value as DealStatus | "")} aria-label="Filter by status">
          <option value="">All deals</option>
          <option value="ACTIVE">Just started</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="UNDER_REVIEW">Under review</option>
          <option value="PAYMENT_MARKED">Payment marked</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </Select>
      </PageTitle>

      {query.isPending ? (
        <div className="grid gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : items.length === 0 ? (
        <Card>
          <p className="font-display text-2xl text-ink">No deals yet</p>
          <p className="mt-2 text-sm text-zinc-600">
            {isBrand ? "Approve an applicant on one of your campaigns to start a deal." : "When a brand approves your application, the deal appears here."}
          </p>
        </Card>
      ) : (
        <ul className="flex flex-col gap-4">
          {items.map((d, i) => (
            <Reveal as="li" key={d.id} delay={Math.min(i, 6) * 60}>
              <Link href={`/deals/${d.id}`} className="block">
                <Card interactive className="flex flex-wrap items-center justify-between gap-4 p-6">
                  <div className="flex min-w-0 flex-col gap-2">
                    {isBrand ? <span className="text-sm text-zinc-600">with {d.creator.displayName}</span> : <BrandLine brand={d.brand} />}
                    <p className="truncate font-display text-2xl tracking-tight text-ink">{d.campaignTitle}</p>
                    {d.nextAction && NEXT_ACTION_COPY[d.nextAction] && (
                      <p className="text-sm font-medium text-gold-deep">{NEXT_ACTION_COPY[d.nextAction].title}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 text-sm">
                    <StatusBadge status={d.status} />
                    <span className="flex items-center gap-2">
                      <CompensationBadge type={d.compensationType} />
                      <span className="font-medium text-ink">{formatPaise(d.agreedTotalPaise)}</span>
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
