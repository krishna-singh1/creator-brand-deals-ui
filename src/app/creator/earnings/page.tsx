"use client";

import { AppShell } from "@/components/app-shell";
import { MoneyReport } from "@/components/money-report";
import { RequireSession } from "@/components/require-session";

export default function CreatorEarningsPage() {
  return (
    <RequireSession role="CREATOR">
      {(me) => (
        <AppShell me={me}>
          <MoneyReport side="CREATOR" />
        </AppShell>
      )}
    </RequireSession>
  );
}
