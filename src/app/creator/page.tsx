"use client";

import { AppShell } from "@/components/app-shell";
import { RequireSession } from "@/components/require-session";
import { Card } from "@/components/ui";

export default function CreatorHome() {
  return (
    <RequireSession role="CREATOR">
      {(me) => (
        <AppShell me={me}>
          <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-semibold tracking-tight">Welcome to BrandDeal</h1>
            <Card>
              <h2 className="font-medium">Next: complete your creator profile</h2>
              <p className="mt-1 text-sm text-zinc-600">
                Add your Instagram/Facebook stats, niches and rate card, then submit for verification. Verified creators
                can apply to brand campaigns. (Coming in milestone M2.)
              </p>
            </Card>
          </div>
        </AppShell>
      )}
    </RequireSession>
  );
}
