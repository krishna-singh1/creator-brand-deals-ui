"use client";

import { useState } from "react";

import { CompensationBadge } from "@/components/campaign-bits";
import { PageTitle, Select, StatusBadge } from "@/components/ui";
import { api, unwrap } from "@/lib/api/client";
import type { DealStatus } from "@/lib/deals";
import { formatDateTime, formatPaise } from "@/lib/format";

import { AdminTable, useCursorList } from "../admin-bits";
import { AdminShell } from "../admin-shell";

export default function AdminDealsPage() {
  return (
    <AdminShell>
      <Deals />
    </AdminShell>
  );
}

function Deals() {
  const [status, setStatus] = useState<DealStatus | "">("");
  const list = useCursorList(["admin", "deals", status], (cursor) =>
    unwrap(api.GET("/admin/deals", { params: { query: { status: status || undefined, cursor, limit: 25 } } })),
  );

  return (
    <div className="flex flex-col gap-8">
      <PageTitle eyebrow="Admin" title="Deals" subtitle="All collaborations, newest first. Filter by cancelled to review why deals fall through.">
        <Select className="w-48" aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value as DealStatus | "")}>
          <option value="">All deals</option>
          <option value="ACTIVE">Just started</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="UNDER_REVIEW">Under review</option>
          <option value="CONTENT_APPROVED">Awaiting payment</option>
          <option value="PAYMENT_MARKED">Payment marked</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </Select>
      </PageTitle>
      <AdminTable
        headers={["Campaign", "Brand", "Creator", "Value", "Created", "Status"]}
        empty={list.items.length === 0}
        loading={list.isPending}
        hasMore={!!list.hasNextPage}
        loadingMore={list.isFetchingNextPage}
        onMore={() => list.fetchNextPage()}
      >
        {list.items.map((d) => (
          <tr key={d.id}>
            <td className="px-4 py-3 font-medium text-ink">{d.campaignTitle}</td>
            <td className="px-4 py-3">{d.brand.brandName}</td>
            <td className="px-4 py-3">{d.creator.displayName}</td>
            <td className="whitespace-nowrap px-4 py-3">
              <span className="flex items-center gap-2">
                <CompensationBadge type={d.compensationType} />
                {formatPaise(d.agreedTotalPaise)}
              </span>
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-zinc-600">{formatDateTime(d.createdAt)}</td>
            <td className="px-4 py-3">
              <StatusBadge status={d.status} />
            </td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}
