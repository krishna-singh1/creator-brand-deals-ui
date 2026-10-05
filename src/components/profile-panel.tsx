"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef } from "react";

import { api, type Me, unwrap } from "@/lib/api/client";
import { formatPaise } from "@/lib/format";
import { istToday, PRESETS } from "@/lib/money-report";

import { Button } from "./ui";

export type NavItem = { href: string; label: string; icon?: React.ReactNode };

const ROLE_LABEL: Record<string, string> = { CREATOR: "Creator", BRAND: "Brand", ADMIN: "Admin" };

const CREATOR_STATUS: Record<string, { label: string; tone: string }> = {
  VERIFIED: { label: "Verified", tone: "text-emerald-800" },
  PENDING_VERIFICATION: { label: "Under review", tone: "text-amber-900" },
  REJECTED: { label: "Needs changes", tone: "text-red-700" },
  DRAFT: { label: "Not verified yet", tone: "text-zinc-500" },
  SUSPENDED: { label: "Suspended", tone: "text-red-700" },
};

type Section = { title: string; links: (NavItem & { meta?: React.ReactNode })[] };

/** Personal links for each role, grouped. Work pages (campaigns, deals…) stay in the top bar. */
function sections(me: Me, monthTotal: string | undefined): Section[] {
  const status = me.onboarding.creatorStatus ? CREATOR_STATUS[me.onboarding.creatorStatus] : undefined;
  switch (me.role) {
    case "CREATOR":
      return [
        {
          title: "You",
          links: [
            { href: "/creator/profile", label: "Profile" },
            { href: "/creator/verification", label: "Verification", meta: status && <span className={status.tone}>{status.label}</span> },
          ],
        },
        { title: "Money", links: [{ href: "/creator/earnings", label: "Earnings", meta: monthTotal && `${monthTotal} this month` }] },
        { title: "Settings", links: [{ href: "/account", label: "Account & security" }] },
      ];
    case "BRAND":
      return [
        { title: "You", links: [{ href: "/brand/profile", label: "Brand profile" }] },
        { title: "Money", links: [{ href: "/brand/spend", label: "Spend", meta: monthTotal && `${monthTotal} this month` }] },
        { title: "Settings", links: [{ href: "/account", label: "Account & security" }] },
      ];
    default:
      return [{ title: "Settings", links: [{ href: "/account", label: "Account & security" }] }];
  }
}

/** This month's confirmed earnings (creator) or recorded spend (brand); shares the cache with the report pages. */
function useMonthTotal(me: Me, enabled: boolean) {
  const range = PRESETS[0].range(istToday());
  const side = me.role === "CREATOR" ? "CREATOR" : me.role === "BRAND" ? "BRAND" : null;
  const { data } = useQuery({
    queryKey: ["money-report", side, range.from, range.to],
    queryFn: () =>
      side === "CREATOR"
        ? unwrap(api.GET("/creator/earnings", { params: { query: range } }))
        : unwrap(api.GET("/brand/spend", { params: { query: range } })),
    enabled: enabled && side !== null,
  });
  if (!data) return undefined;
  return formatPaise(side === "CREATOR" ? data.confirmedPaise : data.totalPaise);
}

/**
 * Slide-in panel from the right, opened from the avatar: who you are, your personal pages and sign-out. On small
 * screens it also lists the work pages, so it doubles as the mobile menu. Modal: focus is trapped inside, Esc or a
 * click outside closes it, and the page behind doesn't scroll.
 */
export function ProfilePanel({
  me,
  open,
  onClose,
  workNav,
  onSignOut,
  signingOut,
}: {
  me: Me;
  open: boolean;
  onClose: () => void;
  workNav: NavItem[];
  onSignOut: () => void;
  signingOut: boolean;
}) {
  const pathname = usePathname();
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const monthTotal = useMonthTotal(me, open);
  const name = me.displayName ?? me.email;

  // Close when the route changes (a link inside was followed).
  const openedAt = useRef(pathname);
  useEffect(() => {
    if (open && pathname !== openedAt.current) onClose();
    openedAt.current = pathname;
  }, [pathname, open, onClose]);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    panel.current?.querySelector<HTMLElement>("a, button")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key !== "Tab" || !panel.current) return;
      const focusable = [...panel.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled])")];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [open, onClose]);

  const linkClass = (href: string) =>
    `flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-[15px] transition-colors ${
      pathname === href || pathname.startsWith(`${href}/`) ? "bg-ink text-ivory" : "text-ink hover:bg-cream"
    }`;

  return (
    <div className={`fixed inset-0 z-50 overflow-hidden ${open ? "" : "pointer-events-none"}`} aria-hidden={!open} inert={!open}>
      <div
        className={`absolute inset-0 bg-ink/20 backdrop-blur-[2px] transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`absolute inset-y-0 right-0 flex h-dvh w-full max-w-sm flex-col bg-ivory shadow-lift transition-[transform,visibility] duration-500 ease-[var(--ease-premium)] ${
          open ? "visible translate-x-0" : "invisible translate-x-full"
        }`}
      >
        <div className="flex items-start gap-4 border-b border-zinc-200/80 p-6">
          <Avatar me={me} size="size-14 text-xl" />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p id={titleId} className="truncate font-display text-2xl text-ink">
              {name}
            </p>
            {me.displayName && <p className="truncate text-sm text-zinc-500">{me.email}</p>}
            <p className="text-[11px] uppercase tracking-[0.18em] text-gold-deep">{ROLE_LABEL[me.role ?? ""] ?? "Member"}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="grid size-9 shrink-0 place-items-center rounded-full text-zinc-500 transition-colors hover:bg-cream hover:text-ink"
          >
            <span aria-hidden className="text-xl leading-none">
              ×
            </span>
          </button>
        </div>

        <nav aria-label="Account" className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-6">
          {me.role !== "ADMIN" && !me.onboarding.profileComplete && (
            <Link href={me.role === "BRAND" ? "/brand/profile" : "/creator/profile"} className="rounded-2xl bg-gold/10 px-4 py-3 text-sm text-gold-deep ring-1 ring-gold/30 hover:bg-gold/15">
              Finish your profile to {me.role === "BRAND" ? "publish campaigns" : "get verified and apply"} →
            </Link>
          )}
          {workNav.length > 0 && (
            <PanelSection title="Go to" className="md:hidden">
              {workNav.map((item) => (
                <Link key={item.href} href={item.href} className={linkClass(item.href)}>
                  {item.label}
                </Link>
              ))}
            </PanelSection>
          )}
          {sections(me, monthTotal).map((s) => (
            <PanelSection key={s.title} title={s.title}>
              {s.links.map((l) => (
                <Link key={l.href} href={l.href} className={linkClass(l.href)}>
                  <span>{l.label}</span>
                  {l.meta && <span className="text-xs opacity-80">{l.meta}</span>}
                </Link>
              ))}
            </PanelSection>
          ))}
        </nav>

        <div className="border-t border-zinc-200/80 p-6">
          <Button variant="secondary" className="w-full" disabled={signingOut} onClick={onSignOut}>
            {signingOut ? "Signing out…" : "Sign out"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function PanelSection({ title, className = "", children }: { title: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <p className="px-3 pb-1 text-[11px] uppercase tracking-[0.18em] text-zinc-500">{title}</p>
      {children}
    </div>
  );
}

export function Avatar({ me, size = "size-9 text-sm" }: { me: Me; size?: string }) {
  const initial = (me.displayName ?? me.email).charAt(0).toUpperCase();
  return me.avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={me.avatarUrl} alt="" className={`${size} shrink-0 rounded-full object-cover ring-2 ring-gold/30`} />
  ) : (
    <span aria-hidden className={`${size} grid shrink-0 place-items-center rounded-full bg-ink font-display text-gold-soft ring-2 ring-gold/30`}>
      {initial}
    </span>
  );
}
