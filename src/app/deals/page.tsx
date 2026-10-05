"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { BrandLine, CompensationBadge } from "@/components/campaign-bits";
import { LoadError } from "@/components/load-error";
import { Reveal } from "@/components/motion";
import { RequireSession } from "@/components/require-session";
import { Button, Card, PageTitle, Select, Skeleton, StatusBadge } from "@/components/ui";
import { api, unwrap } from "@/lib/api/client";
import { DEAL_STATUS_LABELS, type DealStatus, formatDealValue, isYourMove, NEXT_ACTION_COPY } from "@/lib/deals";

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
          {(Object.keys(DEAL_STATUS_LABELS) as DealStatus[]).map((s) => (
            <option key={s} value={s}>
              {DEAL_STATUS_LABELS[s]}
            </option>
          ))}
        </Select>
      </PageTitle>

      {query.isError && !query.data ? (
        <LoadError error={query.error} backHref={isBrand ? "/brand" : "/creator"} backLabel="Back to dashboard" />
      ) : query.isPending ? (
        <div className="grid gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : items.length === 0 && status ? (
        <Card className="flex flex-col items-start gap-4">
          <p className="font-display text-2xl text-ink">No deals match this filter</p>
          <Button variant="secondary" onClick={() => setStatus("")}>
            Show all deals
          </Button>
        </Card>
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
                      <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-gold-deep">
                        {isYourMove(d) && (
                          <span className="rounded-full bg-gold px-2.5 py-0.5 text-[11px] uppercase tracking-[0.12em] text-ink">Your move</span>
                        )}
                        {NEXT_ACTION_COPY[d.nextAction].title}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 text-sm">
                    <StatusBadge status={d.status} />
                    <span className="flex items-center gap-2">
                      <CompensationBadge type={d.compensationType} />
                      <span className="font-medium text-ink">{formatDealValue(d)}</span>
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
