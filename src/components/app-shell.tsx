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

const icon = (d: string) => (
  <svg aria-hidden width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const ICONS = {
  home: icon("M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"),
  campaigns: icon("M4 5h16v14H4zM4 9h16M9 13h6"),
  applications: icon("M8 4h8l3 3v13H5V4h3M9 12h6M9 16h4M8 4v3h8V4"),
  creators: icon("M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20M10 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M20 20v-1.5a3.5 3.5 0 0 0-2.5-3.35M15.5 4.15a3.5 3.5 0 0 1 0 6.7"),
  deals: icon("M3 12.5 7.5 8l3 2 3-3L21 12.5M7 15l3 3 2-1.5 2 1.5 3-3"),
};

/** Work pages: top bar on desktop, floating tab bar on phones. Personal pages (profile, money, account) live in the profile panel. */
const NAV: Record<string, NavItem[]> = {
  CREATOR: [
    { href: "/creator", label: "Home", icon: ICONS.home },
    { href: "/creator/campaigns", label: "Campaigns", icon: ICONS.campaigns },
    { href: "/creator/applications", label: "Applications", icon: ICONS.applications },
    { href: "/deals", label: "Deals", icon: ICONS.deals },
  ],
  BRAND: [
    { href: "/brand", label: "Home", icon: ICONS.home },
    { href: "/brand/campaigns", label: "Campaigns", icon: ICONS.campaigns },
    { href: "/brand/creators", label: "Creators", icon: ICONS.creators },
    { href: "/deals", label: "Deals", icon: ICONS.deals },
  ],
  ADMIN: [{ href: "/admin", label: "Admin" }],
};

/** A nav item is active on its own page and, for section roots, on the pages below it. */
function isActive(pathname: string, href: string) {
  return pathname === href || ((href.split("/").length > 2 || href === "/admin" || href === "/deals") && pathname.startsWith(`${href}/`));
}

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
  const tabBar = nav.length > 1;

  return (
    <div className="app-backdrop flex flex-1 flex-col">
      <header
        className={`sticky top-0 z-40 border-b transition-all duration-500 ease-[var(--ease-premium)] ${
          scrolled ? "border-zinc-200/80 bg-ivory/80 shadow-soft backdrop-blur-xl" : "border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-6 px-6">
          <div className="flex items-center gap-6 lg:gap-10">
            <Logo href={nav[0]?.href ?? "/"} />
            <nav aria-label="Main" className="hidden items-center gap-1 rounded-full border border-zinc-200 bg-white/60 p-1 text-sm md:flex">
              {nav.map((item) => {
                const active = isActive(pathname, item.href);
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
      <main className={`mx-auto w-full max-w-6xl flex-1 animate-page-in px-5 py-10 sm:px-6 sm:py-14 ${tabBar ? "pb-32 md:pb-14" : ""}`}>{children}</main>
      {tabBar && <TabBar nav={nav} pathname={pathname} />}
    </div>
  );
}

/** Phone navigation: a floating dark bar with the work pages, thumb-reachable (hidden from md up). */
function TabBar({ nav, pathname }: { nav: NavItem[]; pathname: string }) {
  return (
    <nav
      aria-label="Main"
      className="noir-panel fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-40 rounded-2xl p-1.5 shadow-noir ring-1 ring-white/10 md:hidden"
    >
      <ul className="grid" style={{ gridTemplateColumns: `repeat(${nav.length}, minmax(0, 1fr))` }}>
        {nav.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] tracking-wide transition-colors duration-300 ${
                  active ? "bg-white/10 text-gold-soft" : "text-ivory/60 hover:text-ivory"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
