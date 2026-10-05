"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { BrandLine, CompensationBadge, MatchScore } from "@/components/campaign-bits";
import { Reveal } from "@/components/motion";
import { RequireSession } from "@/components/require-session";
import { Button, Card, PageTitle, Select, Skeleton, StatusBadge } from "@/components/ui";
import { api, ApiRequestError, type components, unwrap } from "@/lib/api/client";
import { formatDeadline, formatDeliverables, formatOffer } from "@/lib/campaigns";
import { useCategories } from "@/lib/catalog";
import { errorMessage } from "@/lib/errors";

type Compensation = components["schemas"]["CompensationFilter"];
type Sort = "MATCH" | "NEWEST" | "DEADLINE";

export default function CreatorCampaignsPage() {
  return (
    <RequireSession role="CREATOR">
      {(me) => (
        <AppShell me={me}>
          <Feed />
        </AppShell>
      )}
    </RequireSession>
  );
}

function Feed() {
  const { data: categories = [] } = useCategories();
  const [categoryId, setCategoryId] = useState("");
  const [compensation, setCompensation] = useState<Compensation | "">("");
  const [sort, setSort] = useState<Sort>("MATCH");

  const query = useInfiniteQuery({
    queryKey: ["campaigns", "feed", categoryId, compensation, sort],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      unwrap(
        api.GET("/campaigns/feed", {
          params: {
            query: {
              categoryId: categoryId || undefined,
              compensation: compensation || undefined,
              sort,
              cursor: pageParam,
              limit: 12,
            },
          },
        }),
      ),
    getNextPageParam: (last) => last.nextCursor,
    retry: (count, error) => !(error instanceof ApiRequestError && error.status === 403) && count < 2,
  });
  const items = query.data?.pages.flatMap((p) => p.items) ?? [];
  const notVerified = query.error instanceof ApiRequestError && query.error.code === "CREATOR_NOT_VERIFIED";

  return (
    <div className="flex flex-col gap-10">
      <PageTitle
        eyebrow="Campaigns"
        title="Briefs curated for you"
        subtitle="Only campaigns you qualify for, ranked by how well they fit your niche, city, language and rates."
      />

      {notVerified ? (
        <div className="noir-panel grain overflow-hidden rounded-3xl p-8 shadow-noir sm:p-10">
          <p className="text-[11px] uppercase tracking-[0.28em] text-gold-soft">One step away</p>
          <p className="mt-3 max-w-xl font-display text-3xl leading-tight text-ivory sm:text-4xl">Get verified to unlock briefs matched to you</p>
          <ul className="mt-6 grid gap-3 text-sm text-ivory/80 sm:grid-cols-3">
            {["Campaigns ranked by fit with your niche and city", "A suggested price for every deliverable", "Brands can find you and invite you"].map((t) => (
              <li key={t} className="flex items-start gap-2.5">
                <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-gold" />
                {t}
              </li>
            ))}
          </ul>
          <Link
            href="/creator/verification"
            className="mt-8 inline-flex h-11 items-center gap-2 rounded-full bg-gold px-6 text-sm font-medium text-ink transition-all duration-300 hover:-translate-y-0.5 hover:bg-gold-soft hover:shadow-gold"
          >
            Go to verification →
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-center">
            <Select className="w-full sm:w-52" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} aria-label="Niche">
              <option value="">All niches</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Select className="w-full sm:w-56" value={compensation} onChange={(e) => setCompensation(e.target.value as Compensation | "")} aria-label="Compensation">
              <option value="">Any compensation</option>
              <option value="CASH">Cash</option>
              <option value="BARTER">Barter</option>
              <option value="BOTH">Product + cash</option>
            </Select>
            <Select className="col-span-2 w-full sm:col-span-1 sm:ml-auto sm:w-44" value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort">
              <option value="MATCH">Best match</option>
              <option value="NEWEST">Newest</option>
              <option value="DEADLINE">Closing soon</option>
            </Select>
          </div>

          {query.isPending ? (
            <div className="grid gap-5 md:grid-cols-2">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-56" />
              ))}
            </div>
          ) : query.isError ? (
            <p className="text-sm text-red-700">{errorMessage(query.error)}</p>
          ) : items.length === 0 ? (
            <Card>
              <p className="font-display text-2xl text-ink">Nothing matches right now</p>
              <p className="mt-2 text-sm text-zinc-600">New briefs arrive every week. Try clearing the filters, or keep your rates and profile up to date.</p>
            </Card>
          ) : (
            <ul className="grid gap-5 md:grid-cols-2">
              {items.map((c, i) => (
                <Reveal as="li" key={c.id} delay={Math.min(i, 5) * 70}>
                  <Link href={`/creator/campaigns/${c.id}`} className="block h-full">
                    <Card interactive className="flex h-full flex-col gap-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 flex-col gap-3">
                          <span className="flex flex-wrap items-center gap-2">
                            <BrandLine brand={c.brand} />
                            {c.myApplicationStatus && <StatusBadge status={c.myApplicationStatus} />}
                          </span>
                          <p className="font-display text-2xl leading-snug tracking-tight text-ink">{c.title}</p>
                        </div>
                        <MatchScore score={c.matchScore} />
                      </div>
                      <p className="text-sm text-zinc-600">{formatDeliverables(c.deliverables)}</p>
                      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-4">
                        <span className="flex items-center gap-3">
                          <CompensationBadge type={c.compensationType} />
                          <span className="text-sm font-medium text-ink">{formatOffer(c)}</span>
                        </span>
                        <span className="text-xs uppercase tracking-[0.14em] text-zinc-500">{formatDeadline(c.applyBy)}</span>
                      </div>
                      {c.lowValueOffer && (
                        <p className="text-xs text-amber-800">The product&apos;s value is well below your usual rate.</p>
                      )}
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
        </>
      )}
    </div>
  );
}
