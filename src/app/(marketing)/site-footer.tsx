import Link from "next/link";

import { Logo } from "@/components/logo";
import { Reveal } from "@/components/motion";

import { PRODUCT } from "@/lib/product";

const LEGAL = [
  ["/legal/terms", "Terms"],
  ["/legal/privacy", "Privacy"],
  ["/legal/creator-code", "Creator code"],
  ["/legal/brand-code", "Brand code"],
  ["/legal/grievance", "Grievance officer"],
  ["/legal/data-deletion", "Deleting your data"],
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-zinc-200 bg-cream/50">
      <Reveal variant="fade" className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-14 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex max-w-xs flex-col gap-4">
          <Logo />
          <p className="text-sm leading-relaxed text-zinc-600">Curated brand partnerships for India&apos;s finest micro-creators.</p>
        </div>
        <div className="grid grid-cols-2 gap-10 text-sm">
          <div className="flex flex-col gap-3">
            <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">Platform</span>
            <Link href="/brands" className="link-underline w-fit text-zinc-700">For brands</Link>
            <Link href="/creators" className="link-underline w-fit text-zinc-700">For creators</Link>
            <Link href="/login" className="link-underline w-fit text-zinc-700">Sign in</Link>
          </div>
          <div className="flex flex-col gap-3">
            <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">Legal</span>
            {LEGAL.map(([href, label]) => (
              <Link key={href} href={href} className="link-underline w-fit text-zinc-700">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </Reveal>
      <div className="border-t border-zinc-200/70 py-6 text-center text-xs tracking-wide text-zinc-500">
        © {new Date().getFullYear()} {PRODUCT.name}. Crafted in India.
      </div>
    </footer>
  );
}
