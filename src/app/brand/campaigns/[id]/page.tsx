"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use } from "react";

import { AppShell } from "@/components/app-shell";
import { CampaignBrief } from "@/components/campaign-brief";
import { CompensationBadge } from "@/components/campaign-bits";
import { ContentSkeleton, RequireSession } from "@/components/require-session";
import { Button, ErrorText, PageTitle, StatusBadge } from "@/components/ui";
import { api, unwrap } from "@/lib/api/client";
import { formatDeadline } from "@/lib/campaigns";
import { errorMessage } from "@/lib/errors";

export default function BrandCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <RequireSession role="BRAND">
      {(me) => (
        <AppShell me={me}>
          <Detail id={id} />
        </AppShell>
      )}
    </RequireSession>
  );
}

function Detail({ id }: { id: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const key = ["campaigns", id];
  const { data: c } = useQuery({
    queryKey: key,
    queryFn: () => unwrap(api.GET("/campaigns/{campaignId}", { params: { path: { campaignId: id } } })),
  });
  const path = { params: { path: { campaignId: id } } };
  const refresh = (updated?: unknown) => {
    if (updated) queryClient.setQueryData(key, updated);
    queryClient.invalidateQueries({ queryKey: ["campaigns", "mine"] });
    queryClient.invalidateQueries({ queryKey: ["brand", "dashboard"] });
  };
  const publish = useMutation({ mutationFn: () => unwrap(api.POST("/campaigns/{campaignId}/publish", path)), onSuccess: refresh });
  const close = useMutation({ mutationFn: () => unwrap(api.POST("/campaigns/{campaignId}/close", path)), onSuccess: refresh });
  // Same brief as a new draft; the brand adjusts it in the editor, then publishes.
  const reopen = useMutation({
    mutationFn: () => unwrap(api.POST("/campaigns/{campaignId}/duplicate", path)),
    onSuccess: (copy) => {
      queryClient.setQueryData(["campaigns", copy.id], copy);
      refresh();
      router.push(`/brand/campaigns/${copy.id}/edit?reopened=1`);
    },
  });
  const remove = useMutation({
    mutationFn: () => api.DELETE("/campaigns/{campaignId}", path),
    onSuccess: () => {
      refresh();
      router.replace("/brand/campaigns");
    },
  });

  if (!c) return <ContentSkeleton />;
  const error = [publish, close, remove, reopen].find((m) => m.isError)?.error;
  const finished = c.status === "CLOSED" || c.status === "ARCHIVED";

  return (
    <div className="flex flex-col gap-10">
      <Link href="/brand/campaigns" className="text-sm text-zinc-500 hover:text-ink">
        ← All campaigns
      </Link>
      <PageTitle eyebrow={c.status === "PUBLISHED" ? formatDeadline(c.applyBy) : "Campaign"} title={c.title}>
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={c.status} />
          <CompensationBadge type={c.compensationType} />
        </div>
      </PageTitle>

      <div className="flex flex-wrap items-center gap-3">
        {c.status === "DRAFT" && (
          <>
            <Button onClick={() => publish.mutate()} disabled={publish.isPending}>
              {publish.isPending ? "Publishing…" : "Publish campaign"}
            </Button>
            <Link
              href={`/brand/campaigns/${c.id}/edit`}
              className="inline-flex h-11 items-center rounded-full border border-zinc-300 px-6 text-sm font-medium text-ink transition-all hover:-translate-y-0.5 hover:border-ink"
            >
              Edit draft
            </Link>
            <Button
              variant="danger"
              disabled={remove.isPending}
              onClick={() => window.confirm("Delete this draft? This can't be undone.") && remove.mutate()}
            >
              Delete
            </Button>
          </>
        )}
        {c.status !== "DRAFT" && (
          <Link
            href={`/brand/campaigns/${c.id}/applicants`}
            className="inline-flex h-11 items-center rounded-full bg-ink px-6 text-sm font-medium text-ivory shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift"
          >
            Review applicants ({c.applicationCount})
          </Link>
        )}
        {c.status === "PUBLISHED" && (
          <>
            <p className="text-sm text-zinc-600">
              Live for verified creators · {c.approvedCount}/{c.creatorsNeeded} creators approved
            </p>
            <Link
              href={`/brand/campaigns/${c.id}/edit`}
              className="inline-flex h-11 items-center rounded-full border border-zinc-300 px-6 text-sm font-medium text-ink transition-all hover:-translate-y-0.5 hover:border-ink"
            >
              Edit brief
            </Link>
            <Button
              variant="secondary"
              disabled={close.isPending}
              onClick={() => window.confirm("Close applications for this campaign?") && close.mutate()}
            >
              Close applications
            </Button>
          </>
        )}
        {c.status !== "UNPUBLISHED_BY_ADMIN" && (
          <Button variant={finished ? "gold" : "ghost"} disabled={reopen.isPending} onClick={() => reopen.mutate()}>
            {reopen.isPending ? "Copying…" : finished ? "Reopen as new campaign" : "Duplicate"}
          </Button>
        )}
        {c.status === "UNPUBLISHED_BY_ADMIN" && (
          <p className="text-sm text-red-700">Taken down by BrandDeal for breaking the guidelines. It can&apos;t be reopened.</p>
        )}
        <ErrorText>{error && errorMessage(error)}</ErrorText>
      </div>

      <CampaignBrief campaign={c} />
    </div>
  );
}
