import Link from "next/link";
import type { ReactNode } from "react";

import { Reveal } from "@/components/motion";
import { Eyebrow } from "@/components/ui";

import { SpotlightCard } from "./spotlight-card";

export type Step = readonly [title: string, body: string];
export type Feature = { title: string; body: string; icon: string };

/** Hero for a secondary marketing page: eyebrow, display heading, lede, and a primary + secondary action. */
export function PageHero({
  eyebrow,
  title,
  lede,
  ctaLabel,
  ctaName,
}: {
  eyebrow: string;
  title: ReactNode;
  lede: string;
  ctaLabel: string;
  ctaName: string;
}) {
  return (
    <section className="relative isolate pb-20 pt-36 sm:pt-44">
      <div
        aria-hidden
        className="absolute left-1/2 top-24 -z-10 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgb(214_189_142/0.3),transparent_65%)]"
      />
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-7 px-6 text-center">
        <Eyebrow className="animate-fade-up">{eyebrow}</Eyebrow>
        <h1 className="animate-fade-up font-display text-[2.5rem] leading-[1.08] tracking-tight text-ink [animation-delay:120ms] sm:text-6xl">
          {title}
        </h1>
        <p className="max-w-xl animate-fade-up text-lg leading-relaxed text-zinc-600 [animation-delay:260ms]">{lede}</p>
        <div className="flex animate-fade-up flex-wrap items-center justify-center gap-4 pt-2 [animation-delay:400ms]">
          <Link
            href="/login"
            data-analytics-cta={ctaName}
            className="group inline-flex h-14 items-center gap-3 rounded-full bg-ink pl-7 pr-2 text-sm font-medium tracking-wide text-ivory shadow-lift transition-all duration-500 ease-[var(--ease-premium)] hover:-translate-y-0.5 hover:shadow-gold"
          >
            {ctaLabel}
            <span className="grid size-10 place-items-center rounded-full bg-gold text-ink transition-transform duration-500 ease-[var(--ease-premium)] group-hover:translate-x-1">
              →
            </span>
          </Link>
          <Link href="/login" className="link-underline pb-0.5 text-sm font-medium text-ink">
            Sign in
          </Link>
        </div>
      </div>
    </section>
  );
}

/** Numbered, rule-separated steps. */
export function StepList({ steps }: { steps: readonly Step[] }) {
  return (
    <ol className="flex flex-col">
      {steps.map(([title, body], i) => (
        <Reveal key={title} as="li" delay={i * 120} className="group flex gap-6 border-t border-zinc-200 py-7 last:border-b">
          <span className="font-display text-2xl italic text-gold transition-transform duration-500 group-hover:translate-x-1">
            0{i + 1}
          </span>
          <div>
            <h3 className="text-lg font-medium text-ink">{title}</h3>
            <p className="mt-2 leading-relaxed text-zinc-600">{body}</p>
          </div>
        </Reveal>
      ))}
    </ol>
  );
}

export function FeatureGrid({ features }: { features: readonly Feature[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {features.map((f, i) => (
        <Reveal key={f.title} delay={i * 110}>
          <SpotlightCard>
            <div className="mb-6 grid size-12 place-items-center rounded-2xl border border-gold/30 bg-gold/10 text-gold-deep transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110">
              <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
                <path d={f.icon} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="font-display text-2xl tracking-tight">{f.title}</h3>
            <p className="mt-3 leading-relaxed text-zinc-600">{f.body}</p>
          </SpotlightCard>
        </Reveal>
      ))}
    </div>
  );
}

/** Section heading used above StepList / FeatureGrid blocks. */
export function SectionHeading({ eyebrow, title, lede }: { eyebrow: string; title: ReactNode; lede?: string }) {
  return (
    <Reveal className="mx-auto mb-14 flex max-w-2xl flex-col items-center gap-5 text-center">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="font-display text-4xl leading-tight tracking-tight sm:text-5xl">{title}</h2>
      {lede ? <p className="text-lg leading-relaxed text-zinc-600">{lede}</p> : null}
    </Reveal>
  );
}

/** A plainly-worded caveat on an ivory panel, for things we want read rather than skimmed. */
export function PlainNote({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Reveal className="mx-auto max-w-3xl rounded-3xl border border-zinc-200 bg-ivory px-8 py-9">
      <h3 className="font-display text-2xl tracking-tight text-ink">{title}</h3>
      <div className="mt-3 flex flex-col gap-3 leading-relaxed text-zinc-600">{children}</div>
    </Reveal>
  );
}

export function ClosingCta({ title, lede, ctaLabel, ctaName }: { title: ReactNode; lede: string; ctaLabel: string; ctaName: string }) {
  return (
    <section className="relative isolate overflow-hidden py-32">
      <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_50%_100%,rgb(214_189_142/0.35),transparent_70%)]" />
      <Reveal variant="scale" className="mx-auto flex max-w-3xl flex-col items-center gap-8 px-6 text-center">
        <Eyebrow>By invitation, for now</Eyebrow>
        <h2 className="font-display text-5xl leading-[1.05] tracking-tight sm:text-6xl">{title}</h2>
        <p className="max-w-xl text-lg leading-relaxed text-zinc-600">{lede}</p>
        <Link
          href="/login"
          data-analytics-cta={ctaName}
          className="inline-flex h-14 items-center rounded-full bg-gold px-10 text-sm font-medium tracking-wide text-ink shadow-soft transition-all duration-500 ease-[var(--ease-premium)] hover:-translate-y-1 hover:bg-gold-soft hover:shadow-gold"
        >
          {ctaLabel}
        </Link>
      </Reveal>
    </section>
  );
}
