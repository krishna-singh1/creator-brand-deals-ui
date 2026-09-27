"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { RequireSession } from "@/components/require-session";

const TABS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/verifications", label: "Verifications" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/campaigns", label: "Campaigns" },
  { href: "/admin/deals", label: "Deals" },
  { href: "/admin/pricing", label: "Pricing" },
  { href: "/admin/audit", label: "Audit log" },
];

/** Admin area: session guard, app shell and the section tabs. */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <RequireSession role="ADMIN">
      {(me) => (
        <AppShell me={me}>
          <div className="flex flex-col gap-8">
            <nav aria-label="Admin sections" className="-mx-1 flex gap-1 overflow-x-auto border-b border-zinc-200 pb-px text-sm">
              {TABS.map((t) => {
                const active = t.href === "/admin" ? pathname === "/admin" : pathname.startsWith(t.href);
                return (
                  <Link
                    key={t.href}
                    href={t.href}
                    aria-current={active ? "page" : undefined}
                    className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2.5 transition-colors ${
                      active ? "border-ink font-medium text-ink" : "border-transparent text-zinc-500 hover:text-ink"
                    }`}
                  >
                    {t.label}
                  </Link>
                );
              })}
            </nav>
            {children}
          </div>
        </AppShell>
      )}
    </RequireSession>
  );
}
