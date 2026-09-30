import type { ReactNode } from "react";

import { PRODUCT } from "@/lib/product";
import { Logo } from "./logo";

/** Split layout for sign-in and onboarding: editorial brand panel on the left, the task on the right. */
export function AuthLayout({ children, quote }: { children: ReactNode; quote?: { text: string; by: string } }) {
  const q = quote ?? {
    text: "The finest collaborations begin with a simple introduction.",
    by: `The ${PRODUCT.name} promise`,
  };
  return (
    <div className="grid min-h-dvh flex-1 lg:grid-cols-[1fr_1.1fr]">
      <aside className="grain relative hidden overflow-hidden bg-ink p-12 text-ivory lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden className="absolute -right-24 -top-24 size-[28rem] animate-float rounded-full bg-[radial-gradient(circle,rgb(176_141_87/0.35),transparent_65%)]" />
        <div aria-hidden className="absolute -bottom-32 -left-20 size-[26rem] rounded-full bg-[radial-gradient(circle,rgb(214_189_142/0.18),transparent_65%)]" />
        <div className="relative">
          <Logo tone="light" />
        </div>
        <figure className="relative flex max-w-md animate-fade-up flex-col gap-6 [animation-delay:200ms]">
          <span className="font-display text-6xl leading-none text-gold-soft">&ldquo;</span>
          <blockquote className="font-display text-3xl leading-snug">{q.text}</blockquote>
          <figcaption className="text-sm uppercase tracking-[0.2em] text-zinc-400">{q.by}</figcaption>
        </figure>
        <p className="relative text-xs uppercase tracking-[0.24em] text-zinc-500">Curated · Verified · Fairly priced</p>
      </aside>
      <main className="relative flex flex-col items-center justify-center bg-ivory px-6 py-16">
        <div className="absolute left-6 top-6 lg:hidden">
          <Logo />
        </div>
        {children}
      </main>
    </div>
  );
}
