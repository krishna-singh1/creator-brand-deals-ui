"use client";

import { useQuery } from "@tanstack/react-query";
import { use } from "react";

import { AppShell } from "@/components/app-shell";
import { ContentSkeleton, RequireSession } from "@/components/require-session";
import { PageTitle } from "@/components/ui";
import { api, unwrap } from "@/lib/api/client";

import { CampaignForm } from "../../campaign-form";

export default function EditCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <RequireSession role="BRAND">
      {(me) => (
        <AppShell me={me}>
          <Editor id={id} />
        </AppShell>
      )}
    </RequireSession>
  );
}

function Editor({ id }: { id: string }) {
  const { data } = useQuery({
    queryKey: ["campaigns", id],
    queryFn: () => unwrap(api.GET("/campaigns/{campaignId}", { params: { path: { campaignId: id } } })),
  });
  if (!data) return <ContentSkeleton />;
  return (
    <div className="flex flex-col gap-10">
      <PageTitle eyebrow="Edit draft" title={data.title} />
      <CampaignForm key={data.id} campaign={data} />
    </div>
  );
}
