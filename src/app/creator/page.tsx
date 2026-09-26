"use client";

import { useQuery } from "@tanstack/react-query";

import { ActionItems } from "@/components/action-items";
import { AppShell } from "@/components/app-shell";
import { Counter, Reveal } from "@/components/motion";
import { RequireSession } from "@/components/require-session";
import { Card, PageTitle, Skeleton, StatusBadge } from "@/components/ui";
import { api, unwrap } from "@/lib/api/client";

export default function CreatorHome() {
  return (
    <RequireSession role="CREATOR">
      {(me) => (
        <AppShell me={me}>
          <Dashboard name={me.displayName} />
        </AppShell>
      )}
    </RequireSession>
  );
}

function Dashboard({ name }: { name?: string }) {
  const { data } = useQuery({ queryKey: ["creator", "dashboard"], queryFn: () => unwrap(api.GET("/creator/dashboard")) });
  return (
    <div className="flex flex-col gap-10">
      <PageTitle
        eyebrow="Creator studio"
        title={name ? `Good to see you, ${name}` : "Welcome to BrandDeal"}
        subtitle="Your profile, your verification and, soon, the briefs curated for your niche, all in one place."
      >
        {data && <StatusBadge status={data.status} />}
      </PageTitle>
      {data ? (
        <>
          <ActionItems
            items={data.actionItems}
            emptyText={
              data.status === "PENDING_VERIFICATION"
                ? "Your profile is with our review team. Expect a note from us within 48 hours."
                : "You're all set. Curated campaigns arrive in the next release."
            }
          />
          <div className="grid gap-6 sm:grid-cols-3">
            <Stat label="Open applications" value={data.openApplications} delay={0} />
            <Stat label="Active deals" value={data.activeDeals} delay={90} />
            <Stat label="Completed deals" value={data.completedDeals} delay={180} />
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-6">
          <Skeleton className="h-48" />
          <div className="grid gap-6 sm:grid-cols-3">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, delay }: { label: string; value: number; delay: number }) {
  return (
    <Reveal delay={delay}>
      <Card interactive className="p-7">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">{label}</p>
        <p className="mt-3 font-display text-5xl tracking-tight text-ink">
          <Counter value={value} duration={900} />
        </p>
      </Card>
    </Reveal>
  );
}
