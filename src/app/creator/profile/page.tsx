"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { CenteredMessage, RequireSession } from "@/components/require-session";
import { StatusBadge } from "@/components/ui";
import { api, unwrap } from "@/lib/api/client";

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
  if (isPending || !profile) return <CenteredMessage>Loading profile…</CenteredMessage>;

  const missing = profile.missingFields ?? [];
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Creator profile</h1>
          <StatusBadge status={profile.status} />
        </div>
        {missing.length === 0 && (profile.status === "DRAFT" || profile.status === "REJECTED") && (
          <Link href="/creator/verification" className="text-sm font-medium underline">
            Profile complete: submit for verification →
          </Link>
        )}
      </div>
      {missing.length > 0 && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">Still needed before verification: {missing.join(", ")}</p>
      )}
      <ProfileForm key={profile.id} profile={profile} />
      <SocialAccounts />
      <RateCard />
      <Portfolio />
    </div>
  );
}
