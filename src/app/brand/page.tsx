"use client";

import { AppShell } from "@/components/app-shell";
import { RequireSession } from "@/components/require-session";
import { Card } from "@/components/ui";

export default function BrandHome() {
  return (
    <RequireSession role="BRAND">
      {(me) => (
        <AppShell me={me}>
          <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-semibold tracking-tight">Welcome to BrandDeal</h1>
            <Card>
              <h2 className="font-medium">Next: set up your brand profile</h2>
              <p className="mt-1 text-sm text-zinc-600">
                Add your brand details, then post your first campaign to start receiving applications from verified
                creators. (Coming in milestones M2–M3.)
              </p>
            </Card>
          </div>
        </AppShell>
      )}
    </RequireSession>
  );
}
