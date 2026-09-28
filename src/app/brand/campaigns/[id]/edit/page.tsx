"use client";

import { useQuery } from "@tanstack/react-query";
import { use } from "react";

import { AppShell } from "@/components/app-shell";
import { ContentSkeleton, RequireSession } from "@/components/require-session";
import { Card, PageTitle } from "@/components/ui";
import { api, unwrap } from "@/lib/api/client";

import { CampaignForm } from "../../campaign-form";

export default function EditCampaignPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ reopened?: string }>;
}) {
  const { id } = use(params);
  const { reopened } = use(searchParams);
  return (
    <RequireSession role="BRAND">
      {(me) => (
        <AppShell me={me}>
          <Editor id={id} reopened={reopened === "1"} />
        </AppShell>
      )}
    </RequireSession>
  );
}

function Editor({ id, reopened }: { id: string; reopened: boolean }) {
  const { data } = useQuery({
    queryKey: ["campaigns", id],
    queryFn: () => unwrap(api.GET("/campaigns/{campaignId}", { params: { path: { campaignId: id } } })),
  });
  if (!data) return <ContentSkeleton />;
  return (
    <div className="flex flex-col gap-10">
      <PageTitle eyebrow={reopened ? "Reopened as a new draft" : "Edit draft"} title={data.title} />
      {reopened && (
        <Card tone="highlight" className="p-6">
          <p className="font-display text-xl text-ink">Copied from your earlier campaign</p>
          <p className="mt-1 text-sm text-zinc-700">
            Everything is filled in from last time. Check the dates, budget and deliverables, save, then publish it from the
            campaign page. The original campaign and its applicants stay as they were.
          </p>
        </Card>
      )}
      <CampaignForm key={data.id} campaign={data} />
    </div>
  );
}
