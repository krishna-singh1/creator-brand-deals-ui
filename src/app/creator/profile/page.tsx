"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { ContentSkeleton, RequireSession } from "@/components/require-session";
import { StatusBadge } from "@/components/ui";
import { api, unwrap } from "@/lib/api/client";
import { humanizeMissing } from "@/lib/format";

import { Portfolio } from "./portfolio";
import { ProfileForm } from "./profile-form";
import { RateCard } from "./rate-card";
import { SocialAccounts } from "./social-accounts";

export default function CreatorProfilePage() {
  return (
    <RequireSession role="CREATOR">
      {(me) => (
        <AppShell me={me}>
          <ProfileSections />
        </AppShell>
      )}
    </RequireSession>
  );
}

function ProfileSections() {
  const { data: profile, isPending } = useQuery({
    queryKey: ["creator", "profile"],
    queryFn: () => unwrap(api.GET("/creator/profile")),
  });
  if (isPending || !profile) return <ContentSkeleton />;

  const missing = profile.missingFields ?? [];
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-4xl tracking-tight text-ink">Creator profile</h1>
          <StatusBadge status={profile.status} />
        </div>
        {missing.length === 0 && (profile.status === "DRAFT" || profile.status === "REJECTED") && (
          <Link href="/creator/verification" className="link-underline text-sm font-medium text-ink">
            Profile complete: submit for verification →
          </Link>
        )}
      </div>
      {missing.length > 0 && (
        <p className="flex animate-fade-in items-center gap-3 rounded-2xl border border-gold/30 bg-gold/5 px-5 py-4 text-sm text-zinc-700">
          <span aria-hidden className="size-2 shrink-0 rounded-full bg-gold" />
          <span>
            Before verification, add your <span className="font-medium text-ink">{humanizeMissing(missing)}</span>.
          </span>
        </p>
      )}
      <ProfileForm key={profile.id} profile={profile} />
      <SocialAccounts />
      <RateCard />
      <Portfolio />
    </div>
  );
}
