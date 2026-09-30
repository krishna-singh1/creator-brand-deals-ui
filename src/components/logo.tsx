import Link from "next/link";

import { PRODUCT } from "@/lib/product";

/** Wordmark: the first half of the name in serif, the second in gold italic, with a small monogram. */
export function Logo({ href = "/", tone = "dark" }: { href?: string; tone?: "dark" | "light" }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-2.5" aria-label={PRODUCT.name}>
      <span
        className={`grid size-8 place-items-center rounded-full border transition-transform duration-500 ease-[var(--ease-premium)] group-hover:rotate-[20deg] ${
          tone === "dark" ? "border-ink/15 bg-ink text-gold-soft" : "border-white/20 bg-white/5 text-gold-soft"
        }`}
      >
        <span className="font-display text-sm italic leading-none">{PRODUCT.monogram}</span>
      </span>
      <span className={`font-display text-xl tracking-tight ${tone === "dark" ? "text-ink" : "text-ivory"}`}>
        {PRODUCT.wordmark[0]}
        <span className="italic text-gold">{PRODUCT.wordmark[1]}</span>
      </span>
    </Link>
  );
}
