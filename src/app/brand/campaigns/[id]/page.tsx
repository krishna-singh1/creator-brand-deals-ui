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
  const remove = useMutation({
    mutationFn: () => api.DELETE("/campaigns/{campaignId}", path),
    onSuccess: () => {
      refresh();
      router.replace("/brand/campaigns");
    },
  });

  if (!c) return <ContentSkeleton />;
  const error = [publish, close, remove].find((m) => m.isError)?.error;

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
        {c.status === "PUBLISHED" && (
          <>
            <p className="text-sm text-zinc-600">
              Live for verified creators · {c.applicationCount} applications · {c.approvedCount}/{c.creatorsNeeded} creators
            </p>
            <Button
              variant="secondary"
              disabled={close.isPending}
              onClick={() => window.confirm("Close applications for this campaign?") && close.mutate()}
            >
              Close applications
            </Button>
          </>
        )}
        <ErrorText>{error && errorMessage(error)}</ErrorText>
      </div>

      <CampaignBrief campaign={c} />
    </div>
  );
}
