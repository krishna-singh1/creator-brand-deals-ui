"use client";

import { useQuery } from "@tanstack/react-query";

import { ActionItems } from "@/components/action-items";
import { AppShell } from "@/components/app-shell";
import { RequireSession } from "@/components/require-session";
import { Card, StatusBadge } from "@/components/ui";
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
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{name ? `Hi, ${name}` : "Welcome to BrandDeal"}</h1>
        {data && <StatusBadge status={data.status} />}
      </div>
      {data && (
        <>
          <ActionItems
            items={data.actionItems}
            emptyText={
              data.status === "PENDING_VERIFICATION"
                ? "Your profile is under review. We'll email you within 48 hours."
                : "You're all set. Campaigns open up in the next release."
            }
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label="Open applications" value={data.openApplications} />
            <Stat label="Active deals" value={data.activeDeals} />
            <Stat label="Completed deals" value={data.completedDeals} />
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-4">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </Card>
  );
}
