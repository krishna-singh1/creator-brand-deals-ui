"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { Button, Card, ErrorText, PageTitle, Select, Skeleton, StatusBadge } from "@/components/ui";
import { api, unwrap } from "@/lib/api/client";
import type { BrandProfile, BrandVerificationStatus } from "@/lib/brand";
import { useCategories } from "@/lib/catalog";
import { errorMessage } from "@/lib/errors";
import { formatDateTime } from "@/lib/format";

import { ReasonAction, useCursorList } from "../admin-bits";
import { AdminShell } from "../admin-shell";

export default function AdminBrandsPage() {
  return (
    <AdminShell>
      <Brands />
    </AdminShell>
  );
}

function Brands() {
  const [status, setStatus] = useState<BrandVerificationStatus | "">("PENDING");
  const list = useCursorList(["admin", "brands", status], (cursor) =>
    unwrap(api.GET("/admin/brands", { params: { query: { verification: status || undefined, cursor, limit: 20 } } })),
  );
  return (
    <div className="flex flex-col gap-8">
      <PageTitle eyebrow="Admin" title="Brands" subtitle="New brands wait here until you verify them. They can draft, but not publish or invite, until then.">
        <Select className="w-48" aria-label="Verification" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
          <option value="PENDING">Waiting for review</option>
          <option value="REJECTED">Rejected</option>
          <option value="VERIFIED">Verified</option>
          <option value="">All</option>
        </Select>
      </PageTitle>
      {list.isPending ? (
        <Skeleton className="h-48" />
      ) : list.items.length === 0 ? (
        <Card>
          <p className="text-sm text-zinc-600">{status === "PENDING" ? "No brands waiting." : "Nothing here."}</p>
        </Card>
      ) : (
        list.items.map((b) => <BrandCard key={b.id} brand={b} />)
      )}
      {list.hasNextPage && (
        <Button variant="secondary" className="self-center" onClick={() => list.fetchNextPage()} disabled={list.isFetchingNextPage}>
          Load more
        </Button>
      )}
    </div>
  );
}

function BrandCard({ brand: b }: { brand: BrandProfile }) {
  const queryClient = useQueryClient();
  const { data: categories = [] } = useCategories();
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin", "brands"] });
  const path = { params: { path: { brandId: b.id } } };
  const verify = useMutation({ mutationFn: () => unwrap(api.POST("/admin/brands/{brandId}/verify", path)), onSuccess: refresh });
  const reject = useMutation({
    mutationFn: (reason: string) => unwrap(api.POST("/admin/brands/{brandId}/reject", { ...path, body: { reason } })),
    onSuccess: refresh,
  });
  const facts: [string, React.ReactNode][] = [
    ["Niche", categories.find((c) => c.id === b.categoryId)?.name ?? "—"],
    ["Website", b.website ? <a href={b.website} target="_blank" rel="noreferrer" className="link-underline">{b.website}</a> : "—"],
    [
      "Instagram",
      b.instagramHandle ? (
        <a href={`https://www.instagram.com/${b.instagramHandle}/`} target="_blank" rel="noreferrer" className="link-underline">
          @{b.instagramHandle}
        </a>
      ) : (
        "—"
      ),
    ],
    ["Contact", `${b.contactName ?? "—"} · ${b.contactEmail ?? ""} · ${b.contactPhone ?? ""}`],
    ["City", b.city?.name ?? "—"],
    ["GSTIN", b.gstin ?? "—"],
  ];
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-4">
          {b.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={b.logoUrl} alt="" className="size-12 rounded-2xl object-cover ring-1 ring-zinc-200" />
          ) : (
            <span className="grid size-12 place-items-center rounded-2xl bg-ink font-display text-lg text-gold-soft">{b.brandName?.charAt(0)}</span>
          )}
          <div>
            <p className="font-display text-2xl text-ink">{b.brandName}</p>
            <p className="text-xs text-zinc-500">
              {b.verificationRequestedAt ? `Submitted ${formatDateTime(b.verificationRequestedAt)}` : ""}
            </p>
          </div>
        </div>
        <StatusBadge status={b.verificationStatus ?? "UNSUBMITTED"} />
      </div>
      <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        {facts.map(([label, value]) => (
          <div key={label} className="flex gap-2">
            <dt className="w-24 shrink-0 text-zinc-500">{label}</dt>
            <dd className="min-w-0 break-words text-ink">{value}</dd>
          </div>
        ))}
      </dl>
      {b.verificationStatus === "REJECTED" && b.verificationNote && <p className="text-sm text-red-700">Rejected: {b.verificationNote}</p>}
      {b.verificationStatus === "PENDING" && (
        <div className="flex flex-wrap items-start gap-3">
          <Button onClick={() => verify.mutate()} disabled={verify.isPending}>
            {verify.isPending ? "Verifying…" : "Verify brand"}
          </Button>
          <ReasonAction
            label="Reject"
            confirmLabel="Reject verification"
            prompt="What should the brand fix? They'll see this."
            pending={reject.isPending}
            error={reject.error}
            onConfirm={(reason) => reject.mutate(reason)}
          />
          <ErrorText>{verify.isError && errorMessage(verify.error)}</ErrorText>
        </div>
      )}
    </Card>
  );
}
