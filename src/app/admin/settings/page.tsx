"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Card, ErrorText, PageTitle, Skeleton, Switch } from "@/components/ui";
import { api, type components, unwrap } from "@/lib/api/client";
import { errorMessage } from "@/lib/errors";
import { formatDateTime } from "@/lib/format";

import { AdminShell } from "../admin-shell";

type Flag = components["schemas"]["FeatureFlag"];

const FLAGS_KEY = ["admin", "feature-flags"];

const TITLES: Record<Flag["key"], { title: string; unavailable: string }> = {
  INSTAGRAM_VERIFICATION: {
    title: "Verify creators with Instagram",
    unavailable:
      "Set INSTAGRAM_APP_ID, INSTAGRAM_APP_SECRET and INSTAGRAM_REDIRECT_URI on the API first (docs/12-deployment.md). Until Meta approves the app, only Instagram testers can connect.",
  },
};

export default function AdminSettingsPage() {
  return (
    <AdminShell>
      <div className="flex max-w-3xl flex-col gap-8">
        <PageTitle eyebrow="Admin" title="Settings" subtitle="Switch features on or off. Every change is recorded in the audit log." />
        <Flags />
      </div>
    </AdminShell>
  );
}

function Flags() {
  const { data } = useQuery({ queryKey: FLAGS_KEY, queryFn: () => unwrap(api.GET("/admin/feature-flags")) });
  if (!data) return <Skeleton className="h-32 w-full" />;
  return (
    <div className="flex flex-col gap-4">
      {data.items.map((flag) => (
        <FlagCard key={flag.key} flag={flag} />
      ))}
    </div>
  );
}

function FlagCard({ flag }: { flag: Flag }) {
  const queryClient = useQueryClient();
  const set = useMutation({
    mutationFn: (enabled: boolean) =>
      unwrap(api.PUT("/admin/feature-flags/{flagKey}", { params: { path: { flagKey: flag.key } }, body: { enabled } })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: FLAGS_KEY }),
  });
  const copy = TITLES[flag.key];
  const enabled = set.isPending ? set.variables : flag.enabled;

  return (
    <Card>
      <div className="flex items-start justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="font-display text-2xl tracking-tight text-ink">{copy.title}</h2>
          <p className="text-sm leading-relaxed text-zinc-600">{flag.description}</p>
          {!flag.available && <p className="text-sm text-amber-800">Not set up yet. {copy.unavailable}</p>}
          <p className="text-xs text-zinc-500">
            {enabled ? "On" : "Off"}
            {flag.updatedAt && ` · changed ${formatDateTime(flag.updatedAt)}`}
          </p>
        </div>
        <Switch
          label={copy.title}
          checked={enabled}
          disabled={set.isPending || (!flag.available && !flag.enabled)}
          onChange={(next) => set.mutate(next)}
        />
      </div>
      <ErrorText>{set.isError && errorMessage(set.error)}</ErrorText>
    </Card>
  );
}
