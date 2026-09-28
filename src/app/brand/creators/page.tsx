"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { CreatorAvatar } from "@/components/creator-avatar";
import { Reveal } from "@/components/motion";
import { RequireSession } from "@/components/require-session";
import { Button, Card, ErrorText, Input, PageTitle, Select, Skeleton } from "@/components/ui";
import { api, unwrap } from "@/lib/api/client";
import { reliability } from "@/lib/applications";
import { useCategories, useCities } from "@/lib/catalog";
import { type CreatorCard, type CreatorFilters, EMPTY_FILTERS, toQuery } from "@/lib/creators";
import { errorMessage } from "@/lib/errors";
import { formatCount } from "@/lib/format";
import { useDebounced } from "@/lib/use-debounced";

export default function BrandCreatorsPage() {
  return (
    <RequireSession role="BRAND">
      {(me) => (
        <AppShell me={me}>
          <Discover />
        </AppShell>
      )}
    </RequireSession>
  );
}

function Discover() {
  const [filters, setFilters] = useState<CreatorFilters>(EMPTY_FILTERS);
  const query = toQuery(useDebounced(filters));
  const results = useInfiniteQuery({
    queryKey: ["brand", "creators", query],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => unwrap(api.GET("/brand/creators", { params: { query: { ...query, cursor: pageParam, limit: 24 } } })),
    getNextPageParam: (last) => last.nextCursor,
  });
  const creators = results.data?.pages.flatMap((p) => p.items) ?? [];
  const set = (patch: Partial<CreatorFilters>) => setFilters((f) => ({ ...f, ...patch }));

  return (
    <div className="flex flex-col gap-10">
      <PageTitle
        eyebrow="Discover"
        title="Find creators"
        subtitle="Verified creators only. Open a profile to see their work and rates, then invite them to a live campaign."
      />
      <Filters filters={filters} set={set} />
      <ErrorText>{results.isError && errorMessage(results.error)}</ErrorText>
      {results.isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-44" />
          ))}
        </div>
      ) : creators.length === 0 ? (
        <Card>
          <p className="font-display text-2xl text-ink">No creators match</p>
          <p className="mt-1 text-sm text-zinc-600">Try a wider follower range or fewer filters.</p>
          <Button variant="secondary" className="mt-4" onClick={() => setFilters(EMPTY_FILTERS)}>
            Clear filters
          </Button>
        </Card>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Creators">
          {creators.map((c, i) => (
            <Reveal key={c.id} as="li" delay={Math.min(i, 8) * 40}>
              <CreatorResult creator={c} />
            </Reveal>
          ))}
        </ul>
      )}
      {results.hasNextPage && (
        <Button variant="secondary" className="self-center" onClick={() => results.fetchNextPage()} disabled={results.isFetchingNextPage}>
          {results.isFetchingNextPage ? "Loading…" : "Show more creators"}
        </Button>
      )}
    </div>
  );
}

function Filters({ filters: f, set }: { filters: CreatorFilters; set: (patch: Partial<CreatorFilters>) => void }) {
  const { data: categories = [] } = useCategories();
  const { data: cities = [] } = useCities();
  return (
    <Card className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
      <Input aria-label="Search by name or handle" placeholder="Name or @handle" value={f.q} onChange={(e) => set({ q: e.target.value })} className="lg:col-span-2" />
      <Select aria-label="Niche" value={f.categoryId} onChange={(e) => set({ categoryId: e.target.value })}>
        <option value="">All niches</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </Select>
      <Select aria-label="City" value={f.cityId} onChange={(e) => set({ cityId: e.target.value })}>
        <option value="">All cities</option>
        {cities.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </Select>
      <Select aria-label="Platform" value={f.platform} onChange={(e) => set({ platform: e.target.value as CreatorFilters["platform"] })}>
        <option value="">Any platform</option>
        <option value="INSTAGRAM">Instagram</option>
        <option value="FACEBOOK">Facebook</option>
      </Select>
      <Input aria-label="Minimum followers" type="number" min={0} placeholder="Followers from" value={f.followersMin} onChange={(e) => set({ followersMin: e.target.value })} />
      <Input aria-label="Maximum followers" type="number" min={0} placeholder="Followers up to" value={f.followersMax} onChange={(e) => set({ followersMax: e.target.value })} />
      <Input aria-label="Minimum engagement rate" type="number" min={0} step="0.1" placeholder="Engagement ≥ %" value={f.engagementRateMin} onChange={(e) => set({ engagementRateMin: e.target.value })} />
    </Card>
  );
}

function CreatorResult({ creator: c }: { creator: CreatorCard }) {
  const r = reliability(c);
  return (
    <Link href={`/brand/creators/${c.id}`} className="group block h-full">
      <Card interactive className="flex h-full flex-col gap-4">
        <div className="flex items-center gap-4">
          <CreatorAvatar name={c.displayName} url={c.avatarUrl} />
          <div className="min-w-0">
            <p className="truncate font-display text-2xl text-ink">{c.displayName}</p>
            <p className="truncate text-sm text-zinc-600">
              @{c.handle}
              {c.city ? ` · ${c.city}` : ""}
            </p>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-[0.14em] text-zinc-500">Followers</dt>
            <dd className="font-display text-xl text-ink">{formatCount(c.followers)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.14em] text-zinc-500">Engagement</dt>
            <dd className="font-display text-xl text-ink">{c.engagementRate}%</dd>
          </div>
        </dl>
        <p className="mt-auto flex flex-wrap items-center gap-2 text-xs text-zinc-600">
          {c.metricSource === "ADMIN_VERIFIED" && <span className="uppercase tracking-[0.14em] text-emerald-700">Metrics verified</span>}
          <span>{r.isNew ? "New to BrandDeal" : `${r.completed} deal${r.completed === 1 ? "" : "s"} completed`}</span>
          {r.oftenCancels && <span className="rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-900 ring-1 ring-amber-200">Often cancels</span>}
        </p>
      </Card>
    </Link>
  );
}
