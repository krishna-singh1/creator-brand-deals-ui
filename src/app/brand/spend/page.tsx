"use client";

import { AppShell } from "@/components/app-shell";
import { MoneyReport } from "@/components/money-report";
import { RequireSession } from "@/components/require-session";

export default function BrandSpendPage() {
  return (
    <RequireSession role="BRAND">
      {(me) => (
        <AppShell me={me}>
          <MoneyReport side="BRAND" />
        </AppShell>
      )}
    </RequireSession>
  );
}
