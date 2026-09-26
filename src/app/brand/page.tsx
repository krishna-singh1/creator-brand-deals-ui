"use client";

import { useQuery } from "@tanstack/react-query";

import { ActionItems } from "@/components/action-items";
import { AppShell } from "@/components/app-shell";
import { RequireSession } from "@/components/require-session";
import { api, unwrap } from "@/lib/api/client";

export default function BrandHome() {
  return (
    <RequireSession role="BRAND">
      {(me) => (
        <AppShell me={me}>
          <Dashboard name={me.displayName} />
        </AppShell>
      )}
    </RequireSession>
  );
}

function Dashboard({ name }: { name?: string }) {
  const { data } = useQuery({ queryKey: ["brand", "dashboard"], queryFn: () => unwrap(api.GET("/brand/dashboard")) });
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">{name ? `Welcome, ${name}` : "Welcome to BrandDeal"}</h1>
      {data && <ActionItems items={data.actionItems} emptyText="You're all set." />}
    </div>
  );
}
