"use client";

import Link from "next/link";
import { useState } from "react";

import { Logo } from "@/components/logo";
import { useScrolled } from "@/components/motion";

const LINKS = [
  { href: "#brands", label: "For brands" },
  { href: "#creators", label: "For creators" },
  { href: "#how", label: "How it works" },
  { href: "#stories", label: "Stories" },
];

/** Transparent over the hero, then a frosted ivory bar once the page scrolls. */
export function SiteHeader() {
  const scrolled = useScrolled();
  const [open, setOpen] = useState(false);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ease-[var(--ease-premium)] ${
        scrolled ? "border-b border-zinc-200/70 bg-ivory/80 py-3 shadow-soft backdrop-blur-xl" : "border-b border-transparent py-5"
      }`}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6">
        <Logo />
        <nav className="hidden items-center gap-8 text-sm text-zinc-600 md:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="link-underline pb-0.5 hover:text-ink">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <Link href="/login" className="link-underline pb-0.5 text-sm text-zinc-700 hover:text-ink">
            Sign in
          </Link>
          <Link
            href="/login"
            className="inline-flex h-10 items-center rounded-full bg-ink px-5 text-sm font-medium text-ivory shadow-soft transition-all duration-300 ease-[var(--ease-premium)] hover:-translate-y-0.5 hover:shadow-lift"
          >
            Request access
          </Link>
        </div>
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="grid size-10 place-items-center rounded-full border border-zinc-300 md:hidden"
        >
          <span className="relative block h-3 w-4">
            <span className={`absolute left-0 top-0 h-px w-4 bg-ink transition-transform duration-300 ${open ? "translate-y-1.5 rotate-45" : ""}`} />
            <span className={`absolute bottom-0 left-0 h-px w-4 bg-ink transition-transform duration-300 ${open ? "-translate-y-1.5 -rotate-45" : ""}`} />
          </span>
        </button>
      </div>
      <div
        className={`grid overflow-hidden px-6 transition-[grid-template-rows,opacity] duration-500 ease-[var(--ease-premium)] md:hidden ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <nav className="min-h-0">
          <div className="flex flex-col gap-4 pb-4 pt-6 text-lg">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="font-display">
                {l.label}
              </a>
            ))}
            <Link href="/login" className="mt-2 inline-flex h-12 items-center justify-center rounded-full bg-ink text-sm font-medium text-ivory">
              Request access
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
