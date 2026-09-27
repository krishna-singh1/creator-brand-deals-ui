"use client";

import { useState } from "react";

import { PageTitle, Select } from "@/components/ui";
import { api, unwrap } from "@/lib/api/client";
import { formatDateTime } from "@/lib/format";

import { AdminTable, useCursorList } from "../admin-bits";
import { AdminShell } from "../admin-shell";

const ENTITY_TYPES = [
  { value: "", label: "Everything" },
  { value: "user", label: "Users" },
  { value: "creator", label: "Creator verification" },
  { value: "campaign", label: "Campaigns" },
  { value: "pricing_rate_table", label: "Pricing" },
];

const ACTION_LABELS: Record<string, string> = {
  USER_SUSPENDED: "Suspended a user",
  USER_REINSTATED: "Reinstated a user",
  CREATOR_VERIFIED: "Verified a creator",
  CREATOR_VERIFICATION_REJECTED: "Rejected a verification",
  CAMPAIGN_UNPUBLISHED: "Took down a campaign",
  RATE_TABLE_PUBLISHED: "Published a rate table",
};

export default function AdminAuditPage() {
  return (
    <AdminShell>
      <Audit />
    </AdminShell>
  );
}

function Audit() {
  const [entityType, setEntityType] = useState("");
  const list = useCursorList(["admin", "audit", entityType], (cursor) =>
    unwrap(api.GET("/admin/audit-logs", { params: { query: { entityType: entityType || undefined, cursor, limit: 25 } } })),
  );

  return (
    <div className="flex flex-col gap-8">
      <PageTitle eyebrow="Admin" title="Audit log" subtitle="Every admin action, who did it and why. Entries can't be edited or deleted.">
        <Select className="w-52" aria-label="Show" value={entityType} onChange={(e) => setEntityType(e.target.value)}>
          {ENTITY_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>
      </PageTitle>
      <AdminTable
        headers={["When", "Admin", "Action", "Details"]}
        empty={list.items.length === 0}
        loading={list.isPending}
        hasMore={!!list.hasNextPage}
        loadingMore={list.isFetchingNextPage}
        onMore={() => list.fetchNextPage()}
      >
        {list.items.map((e) => (
          <tr key={e.id} className="align-top">
            <td className="whitespace-nowrap px-4 py-3 text-zinc-600">{formatDateTime(e.createdAt)}</td>
            <td className="px-4 py-3">{e.actor?.displayName ?? "System"}</td>
            <td className="px-4 py-3 font-medium text-ink">{ACTION_LABELS[e.action] ?? e.action}</td>
            <td className="px-4 py-3 text-zinc-600">
              {typeof e.after?.reason === "string" && <p>&ldquo;{e.after.reason}&rdquo;</p>}
              {typeof e.after?.version === "number" && <p>Version {e.after.version}</p>}
              <p className="text-xs text-zinc-400">
                {e.entityType}
                {e.entityId ? ` · ${e.entityId.slice(0, 8)}` : ""}
              </p>
            </td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}
