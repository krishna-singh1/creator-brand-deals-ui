"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { CompensationBadge } from "@/components/campaign-bits";
import { Button, Input, PageTitle, Select, StatusBadge } from "@/components/ui";
import { api, type components, unwrap } from "@/lib/api/client";
import { formatDate } from "@/lib/campaigns";

import { AdminTable, ReasonAction, useCursorList } from "../admin-bits";
import { AdminShell } from "../admin-shell";

type CampaignSummary = components["schemas"]["CampaignSummary"];
type CampaignStatus = components["schemas"]["CampaignStatus"];

export default function AdminCampaignsPage() {
  return (
    <AdminShell>
      <Campaigns />
    </AdminShell>
  );
}

function Campaigns() {
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<CampaignStatus | "">("PUBLISHED");
  const list = useCursorList(["admin", "campaigns", search, status], (cursor) =>
    unwrap(
      api.GET("/admin/campaigns", { params: { query: { q: search || undefined, status: status || undefined, cursor, limit: 25 } } }),
    ),
  );

  return (
    <div className="flex flex-col gap-8">
      <PageTitle eyebrow="Admin" title="Campaigns" subtitle="Every brief on the marketplace. Take down anything that breaks the guidelines." />
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          setSearch(q.trim());
        }}
      >
        <Input className="w-72" placeholder="Campaign title" aria-label="Search campaigns" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select className="w-44" aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value as CampaignStatus | "")}>
          <option value="">Any status</option>
          <option value="PUBLISHED">Live</option>
          <option value="DRAFT">Drafts</option>
          <option value="CLOSED">Closed</option>
          <option value="UNPUBLISHED_BY_ADMIN">Taken down</option>
        </Select>
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>
      <AdminTable
        headers={["Campaign", "Brand", "Type", "Applications", "Apply by", "Status", ""]}
        empty={list.items.length === 0}
        loading={list.isPending}
        hasMore={!!list.hasNextPage}
        loadingMore={list.isFetchingNextPage}
        onMore={() => list.fetchNextPage()}
      >
        {list.items.map((c) => (
          <CampaignRow key={c.id} campaign={c} />
        ))}
      </AdminTable>
    </div>
  );
}

function CampaignRow({ campaign: c }: { campaign: CampaignSummary }) {
  const queryClient = useQueryClient();
  const unpublish = useMutation({
    mutationFn: (reason: string) =>
      unwrap(api.POST("/admin/campaigns/{campaignId}/unpublish", { params: { path: { campaignId: c.id } }, body: { reason } })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "campaigns"] }),
  });
  return (
    <tr className="align-top">
      <td className="px-4 py-3 font-medium text-ink">{c.title}</td>
      <td className="px-4 py-3">{c.brand.brandName}</td>
      <td className="px-4 py-3">
        <CompensationBadge type={c.compensationType} />
      </td>
      <td className="px-4 py-3">
        {c.applicationCount} · {c.approvedCount}/{c.creatorsNeeded} approved
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-zinc-600">{formatDate(c.applyBy)}</td>
      <td className="px-4 py-3">
        <StatusBadge status={c.status} />
      </td>
      <td className="px-4 py-3 text-right">
        {c.status === "PUBLISHED" && (
          <ReasonAction
            label="Take down"
            confirmLabel="Take down campaign"
            prompt="Which guideline does it break? The brand sees this."
            pending={unpublish.isPending}
            error={unpublish.error}
            onConfirm={(reason) => unpublish.mutate(reason)}
          />
        )}
      </td>
    </tr>
  );
}
