"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { api, type Me } from "@/lib/api/client";
import { ME_KEY } from "@/lib/session";

import { Logo } from "./logo";
import { useScrolled } from "./motion";
import { Button } from "./ui";

const NAV: Record<string, { href: string; label: string }[]> = {
  CREATOR: [
    { href: "/creator", label: "Home" },
    { href: "/creator/campaigns", label: "Campaigns" },
    { href: "/creator/profile", label: "Profile" },
    { href: "/creator/verification", label: "Verification" },
    { href: "/account", label: "Account" },
  ],
  BRAND: [
    { href: "/brand", label: "Home" },
    { href: "/brand/campaigns", label: "Campaigns" },
    { href: "/brand/profile", label: "Profile" },
    { href: "/account", label: "Account" },
  ],
  ADMIN: [
    { href: "/admin", label: "Verifications" },
    { href: "/account", label: "Account" },
  ],
};

const ROLE_LABEL: Record<string, string> = { CREATOR: "Creator", BRAND: "Brand", ADMIN: "Admin" };

/** Signed-in layout: frosted sticky header with role navigation, account and sign-out. */
export function AppShell({ me, children }: { me: Me; children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const scrolled = useScrolled(4);
  const queryClient = useQueryClient();
  const logout = useMutation({
    mutationFn: () => api.POST("/auth/logout"),
    onSettled: () => {
      queryClient.setQueryData(ME_KEY, null);
      queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== ME_KEY[0] });
      router.replace("/login");
    },
  });
  const nav = NAV[me.role ?? ""] ?? [];
  const initial = (me.displayName ?? me.email).charAt(0).toUpperCase();

  return (
    <div className="flex flex-1 flex-col bg-ivory">
      <header
        className={`sticky top-0 z-40 border-b transition-all duration-500 ease-[var(--ease-premium)] ${
          scrolled ? "border-zinc-200/80 bg-ivory/80 shadow-soft backdrop-blur-xl" : "border-transparent bg-ivory"
        }`}
      >
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-6 px-6">
          <div className="flex items-center gap-10">
            <Logo href={nav[0]?.href ?? "/"} />
            <nav className="hidden items-center gap-1 rounded-full border border-zinc-200 bg-white/60 p-1 text-sm md:flex">
              {nav.map((item) => {
                const active = pathname === item.href || (item.href.split("/").length > 2 && pathname.startsWith(`${item.href}/`));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`relative rounded-full px-4 py-1.5 transition-colors duration-300 ${
                      active ? "bg-ink text-ivory shadow-soft" : "text-zinc-600 hover:text-ink"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="hidden items-center gap-3 sm:flex">
              <div className="flex flex-col items-end leading-tight">
                <span className="max-w-48 truncate text-ink">{me.displayName ?? me.email}</span>
                <span className="text-[11px] uppercase tracking-[0.18em] text-gold-deep">{ROLE_LABEL[me.role ?? ""] ?? "Member"}</span>
              </div>
              {me.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={me.avatarUrl} alt="" className="size-9 rounded-full object-cover ring-2 ring-gold/30" />
              ) : (
                <span className="grid size-9 place-items-center rounded-full bg-ink font-display text-sm text-gold-soft ring-2 ring-gold/30">
                  {initial}
                </span>
              )}
            </div>
            <Button variant="secondary" className="h-9 px-4" disabled={logout.isPending} onClick={() => logout.mutate()}>
              Sign out
            </Button>
          </div>
        </div>
        {nav.length > 0 && (
          <nav className="flex gap-1 overflow-x-auto px-6 pb-3 text-sm md:hidden">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={pathname === item.href ? "page" : undefined}
                className={`shrink-0 rounded-full px-4 py-1.5 transition-colors ${
                  pathname === item.href ? "bg-ink text-ivory" : "border border-zinc-200 text-zinc-600"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 animate-page-in px-6 py-10 sm:py-14">{children}</main>
    </div>
  );
}
