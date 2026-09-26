"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { RequireSession } from "@/components/require-session";
import { Button, Card, Select, StatusBadge } from "@/components/ui";
import { api, type components, unwrap } from "@/lib/api/client";
import { formatCount, formatDateTime } from "@/lib/format";

type Status = components["schemas"]["VerificationStatus"];

export default function AdminHome() {
  return (
    <RequireSession role="ADMIN">
      {(me) => (
        <AppShell me={me}>
          <Queue />
        </AppShell>
      )}
    </RequireSession>
  );
}

function Queue() {
  const [status, setStatus] = useState<Status>("PENDING");
  const query = useInfiniteQuery({
    queryKey: ["admin", "verifications", status],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      unwrap(api.GET("/admin/verifications", { params: { query: { status, cursor: pageParam, limit: 20 } } })),
    getNextPageParam: (last) => last.nextCursor,
  });
  const items = query.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl tracking-tight text-ink">Creator verifications</h1>
        <Select className="w-44" value={status} onChange={(e) => setStatus(e.target.value as Status)}>
          <option value="PENDING">Pending (oldest first)</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </Select>
      </div>
      <Card className="p-0">
        {items.length === 0 ? (
          <p className="p-6 text-sm text-zinc-500">{query.isPending ? "Loading…" : "Nothing here."}</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Creator</th>
                <th className="px-4 py-3 font-medium">Account</th>
                <th className="px-4 py-3 font-medium">Followers</th>
                <th className="px-4 py-3 font-medium">ER</th>
                <th className="px-4 py-3 font-medium">Submitted</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((v) => (
                <tr key={v.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/verifications/${v.id}`} className="link-underline font-medium text-ink">
                      {v.creator.displayName}
                    </Link>
                    {v.creator.city && <span className="text-zinc-500"> · {v.creator.city}</span>}
                  </td>
                  <td className="px-4 py-3">{v.creator.handle}</td>
                  <td className="px-4 py-3">{formatCount(v.creator.followers)}</td>
                  <td className="px-4 py-3">{v.creator.engagementRate}%</td>
                  <td className="px-4 py-3">{formatDateTime(v.submittedAt)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={v.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
      {query.hasNextPage && (
        <Button variant="secondary" disabled={query.isFetchingNextPage} onClick={() => query.fetchNextPage()}>
          Load more
        </Button>
      )}
    </div>
  );
}
