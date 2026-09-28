"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { api, type Me } from "@/lib/api/client";
import { ME_KEY } from "@/lib/session";

import { Logo } from "./logo";
import { NotificationBell } from "./notification-bell";
import { useScrolled } from "./motion";
import { Avatar, type NavItem, ProfilePanel } from "./profile-panel";

/** Work pages in the top bar. Personal pages (profile, money, account) live in the profile panel. */
const NAV: Record<string, NavItem[]> = {
  CREATOR: [
    { href: "/creator", label: "Home" },
    { href: "/creator/campaigns", label: "Campaigns" },
    { href: "/creator/applications", label: "Applications" },
    { href: "/deals", label: "Deals" },
  ],
  BRAND: [
    { href: "/brand", label: "Home" },
    { href: "/brand/campaigns", label: "Campaigns" },
    { href: "/deals", label: "Deals" },
  ],
  ADMIN: [{ href: "/admin", label: "Admin" }],
};

const ROLE_LABEL: Record<string, string> = { CREATOR: "Creator", BRAND: "Brand", ADMIN: "Admin" };

/** Signed-in layout: frosted sticky header with the work pages; the avatar opens the profile panel. */
export function AppShell({ me, children }: { me: Me; children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const scrolled = useScrolled(4);
  const queryClient = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const logout = useMutation({
    mutationFn: () => api.POST("/auth/logout"),
    onSettled: () => {
      setMenuOpen(false);
      queryClient.setQueryData(ME_KEY, null);
      queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== ME_KEY[0] });
      router.replace("/login");
    },
  });
  const nav = NAV[me.role ?? ""] ?? [];

  return (
    <div className="flex flex-1 flex-col bg-ivory">
      <header
        className={`sticky top-0 z-40 border-b transition-all duration-500 ease-[var(--ease-premium)] ${
          scrolled ? "border-zinc-200/80 bg-ivory/80 shadow-soft backdrop-blur-xl" : "border-transparent bg-ivory"
        }`}
      >
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-6 px-6">
          <div className="flex items-center gap-6 lg:gap-10">
            <Logo href={nav[0]?.href ?? "/"} />
            <nav aria-label="Main" className="hidden items-center gap-1 rounded-full border border-zinc-200 bg-white/60 p-1 text-sm md:flex">
              {nav.map((item) => {
                const active =
                  pathname === item.href ||
                  ((item.href.split("/").length > 2 || item.href === "/admin" || item.href === "/deals") &&
                    pathname.startsWith(`${item.href}/`));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`relative whitespace-nowrap rounded-full px-4 py-1.5 transition-colors duration-300 ${
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
            {me.role && me.role !== "ADMIN" && <NotificationBell />}
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={menuOpen}
              aria-label={`Open profile menu (signed in as ${me.displayName ?? me.email})`}
              className="group flex items-center gap-3 rounded-full py-1 pl-1 pr-1 transition-colors hover:bg-white/70 lg:pl-3"
            >
              <span className="hidden flex-col items-end leading-tight lg:flex">
                <span className="max-w-40 truncate text-ink">{me.displayName ?? me.email}</span>
                <span className="text-[11px] uppercase tracking-[0.18em] text-gold-deep">{ROLE_LABEL[me.role ?? ""] ?? "Member"}</span>
              </span>
              <Avatar me={me} />
              <span aria-hidden className="text-zinc-400 transition-transform group-hover:translate-x-0.5">
                ›
              </span>
            </button>
          </div>
        </div>
      </header>
      <ProfilePanel me={me} open={menuOpen} onClose={closeMenu} workNav={nav} onSignOut={() => logout.mutate()} signingOut={logout.isPending} />
      <main className="mx-auto w-full max-w-6xl flex-1 animate-page-in px-6 py-10 sm:py-14">{children}</main>
    </div>
  );
}
