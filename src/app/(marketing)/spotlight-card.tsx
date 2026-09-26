"use client";

import type { CSSProperties, ReactNode } from "react";

/** Card with a soft gold light that follows the pointer, plus a gentle lift on hover. */
export function SpotlightCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      onPointerMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty("--x", `${e.clientX - rect.left}px`);
        e.currentTarget.style.setProperty("--y", `${e.clientY - rect.top}px`);
      }}
      style={{ "--x": "50%", "--y": "0%" } as CSSProperties}
      className={`group relative h-full overflow-hidden rounded-3xl border border-zinc-200/80 bg-white/70 p-8 shadow-soft transition-all duration-500 ease-[var(--ease-premium)] hover:-translate-y-1.5 hover:border-gold/40 hover:shadow-lift ${className}`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: "radial-gradient(420px circle at var(--x) var(--y), rgb(176 141 87 / 0.12), transparent 60%)" }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}
