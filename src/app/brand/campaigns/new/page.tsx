"use client";

import { AppShell } from "@/components/app-shell";
import { RequireSession } from "@/components/require-session";
import { PageTitle } from "@/components/ui";

import { CampaignForm } from "../campaign-form";

export default function NewCampaignPage() {
  return (
    <RequireSession role="BRAND">
      {(me) => (
        <AppShell me={me}>
          <div className="flex flex-col gap-10">
            <PageTitle
              eyebrow="New campaign"
              title="Write your brief"
              subtitle="Clear briefs attract the right creators. Save as a draft; nothing is visible until you publish."
            />
            <CampaignForm />
          </div>
        </AppShell>
      )}
    </RequireSession>
  );
}
