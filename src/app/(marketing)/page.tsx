import Link from "next/link";

import { AnimatedWords, Counter, Parallax, Reveal } from "@/components/motion";
import { Eyebrow } from "@/components/ui";

import { HeroVisual } from "./hero-visual";
import { LaunchNiches } from "./launch-niches";
import { SpotlightCard } from "./spotlight-card";
import { Stories } from "./stories";

const PILLARS = [
  {
    title: "Curated, never crowded",
    body: "Every creator is verified by hand against their Insights before a brand ever sees them. Quality is the default, not a filter.",
    icon: "M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.9z",
  },
  {
    title: "Pricing with provenance",
    body: "Suggested ranges drawn from follower tier and real engagement, so every quote arrives with context and every offer feels fair.",
    icon: "M4 19h16M7 16V9m5 7V5m5 11v-4",
  },
  {
    title: "Cash, barter, or both",
    body: "Structure collaborations the way Indian D2C actually works: product-only, paid, or a considered blend of the two.",
    icon: "M4 7h16v10H4zM4 11h16M9 15h2",
  },
  {
    title: "Tracked from brief to payout",
    body: "Shipping, content approvals and payment confirmations live in one refined timeline. Nothing lost in DMs.",
    icon: "M5 12l4 4L19 6",
  },
];

const PATHS = [
  {
    href: "/brands",
    cta: "path_brands",
    eyebrow: "For brands",
    title: "Briefs that attract the right voices",
    body: "Write one brief, see a suggested budget before you publish, and hear from verified creators who actually fit it.",
    linkLabel: "How it works for brands",
  },
  {
    href: "/creators",
    cta: "path_creators",
    eyebrow: "For creators",
    title: "Your work, valued properly",
    body: "Get verified once, then choose the collaborations worth your name. Every brief arrives with a range built from your real engagement.",
    linkLabel: "How it works for creators",
  },
];

export default function Home() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="relative isolate pb-24 pt-36 sm:pt-44">
        <Parallax speed={0.25} className="absolute inset-0 -z-10">
          <div aria-hidden className="absolute left-1/2 top-24 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgb(214_189_142/0.35),transparent_65%)]" />
        </Parallax>
        <div className="mx-auto grid w-full max-w-6xl items-center gap-16 px-6 lg:grid-cols-[1.3fr_1fr]">
          <div className="flex flex-col gap-8">
            <Eyebrow className="animate-fade-up">India&apos;s creator partnerships, refined</Eyebrow>
            <h1 className="font-display text-[2.6rem] leading-[1.08] tracking-tight text-ink sm:text-6xl lg:text-[4.1rem]">
              <AnimatedWords text="Where distinctive brands meet the creators" />{" "}
              <AnimatedWords text="worth their name." startDelay={420} className="italic" wordClassName="text-gold-gradient pr-[0.08em]" />
            </h1>
            <p className="max-w-xl animate-fade-up text-lg leading-relaxed text-zinc-600 [animation-delay:650ms]">
              BrandDeal is a curated marketplace for India&apos;s D2C labels and verified micro-creators. Crafted briefs, fairly
              priced collaborations, and every deal tracked from first pitch to final payout.
            </p>
            <div className="flex animate-fade-up flex-wrap items-center gap-4 [animation-delay:800ms]">
              <Link
                href="/login"
                data-analytics-cta="hero_get_started"
                className="group inline-flex h-14 items-center gap-3 rounded-full bg-ink pl-7 pr-2 text-sm font-medium tracking-wide text-ivory shadow-lift transition-all duration-500 ease-[var(--ease-premium)] hover:-translate-y-0.5 hover:shadow-gold"
              >
                Get started
                <span className="grid size-10 place-items-center rounded-full bg-gold text-ink transition-transform duration-500 ease-[var(--ease-premium)] group-hover:translate-x-1">
                  →
                </span>
              </Link>
              <Link href="/login" data-analytics-cta="hero_sign_in" className="link-underline pb-0.5 text-sm font-medium text-ink">
                Sign in
              </Link>
            </div>
            <div className="flex animate-fade-up items-center gap-6 pt-4 text-xs uppercase tracking-[0.2em] text-zinc-500 [animation-delay:950ms]">
              <span>Hand-verified creators</span>
              <span aria-hidden className="size-1 rounded-full bg-gold" />
              <span>Free during beta</span>
            </div>
          </div>
          <div className="animate-fade-up [animation-delay:400ms]">
            <HeroVisual />
          </div>
        </div>
      </section>

      {/* ── Launch niches ── */}
      <section className="border-y border-zinc-200/70 bg-cream/60 py-16">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 px-6">
          <Reveal>
            <h2 className="text-center text-xs font-medium uppercase tracking-[0.3em] text-zinc-500">Launch niches</h2>
          </Reveal>
          <LaunchNiches />
        </div>
      </section>

      {/* ── Pillars ── */}
      <section className="py-28">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal className="mx-auto mb-16 flex max-w-2xl flex-col items-center gap-5 text-center">
            <Eyebrow>Why BrandDeal</Eyebrow>
            <h2 className="font-display text-4xl leading-tight tracking-tight sm:text-5xl">
              Collaboration, <span className="italic text-gold-deep">elevated</span>
            </h2>
            <p className="text-lg leading-relaxed text-zinc-600">
              The rigour of an agency, the ease of a marketplace, and none of the noise.
            </p>
          </Reveal>
          <div className="grid gap-6 sm:grid-cols-2">
            {PILLARS.map((p, i) => (
              <Reveal key={p.title} delay={i * 110}>
                <SpotlightCard>
                  <div className="mb-6 grid size-12 place-items-center rounded-2xl border border-gold/30 bg-gold/10 text-gold-deep transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110">
                    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
                      <path d={p.icon} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <h3 className="font-display text-2xl tracking-tight">{p.title}</h3>
                  <p className="mt-3 leading-relaxed text-zinc-600">{p.body}</p>
                </SpotlightCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Two paths ── */}
      <section id="how" className="scroll-mt-24 bg-white/60 py-28">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal className="mx-auto mb-14 flex max-w-2xl flex-col items-center gap-5 text-center">
            <Eyebrow>How it works</Eyebrow>
            <h2 className="font-display text-4xl leading-tight tracking-tight sm:text-5xl">
              Two sides, <span className="italic text-gold-deep">one standard</span>
            </h2>
          </Reveal>
          <div className="grid gap-6 sm:grid-cols-2">
            {PATHS.map((p, i) => (
              <Reveal key={p.href} delay={i * 110}>
                <Link
                  href={p.href}
                  data-analytics-cta={p.cta}
                  className="group flex h-full flex-col gap-4 rounded-3xl border border-zinc-200 bg-ivory p-9 transition-all duration-500 ease-[var(--ease-premium)] hover:-translate-y-1 hover:border-gold/40 hover:shadow-lift"
                >
                  <Eyebrow>{p.eyebrow}</Eyebrow>
                  <h3 className="font-display text-3xl leading-tight tracking-tight">{p.title}</h3>
                  <p className="leading-relaxed text-zinc-600">{p.body}</p>
                  <span className="mt-auto inline-flex items-center gap-2 pt-4 text-sm font-medium text-ink">
                    {p.linkLabel}
                    <span aria-hidden className="transition-transform duration-500 ease-[var(--ease-premium)] group-hover:translate-x-1">
                      →
                    </span>
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Numbers ── */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6">
        <div className="grid overflow-hidden rounded-3xl border border-zinc-200 bg-ivory sm:grid-cols-2 lg:grid-cols-4 [&>*]:border-zinc-200 max-lg:[&>*:nth-child(-n+2)]:border-b sm:[&>*:nth-child(odd)]:border-r lg:[&>*:not(:last-child)]:border-r">
          {[
            { value: 5, suffix: "", label: "Curated launch niches" },
            { value: 100, suffix: "K", prefix: "5K–", label: "Follower range we champion" },
            { value: 48, suffix: "h", label: "Verification turnaround goal" },
            { value: 0, suffix: "%", label: "Commission during beta" },
          ].map((s, i) => (
            <Reveal key={s.label} delay={i * 100} className="p-10">
              <p className="font-display text-5xl tracking-tight text-ink">
                <Counter value={s.value} prefix={s.prefix} suffix={s.suffix} />
              </p>
              <p className="mt-3 text-sm uppercase tracking-[0.16em] text-zinc-500">{s.label}</p>
            </Reveal>
          ))}
        </div>
        </div>
      </section>

      {/* ── Stories ── */}
      <section id="stories" className="grain scroll-mt-20 bg-ink py-28 text-ivory">
        <div className="mx-auto grid max-w-6xl gap-16 px-6 lg:grid-cols-[0.8fr_1.2fr]">
          <Reveal className="flex flex-col gap-5">
            <Eyebrow className="text-gold-soft">In their words</Eyebrow>
            <h2 className="font-display text-4xl leading-tight tracking-tight">
              Collaborations that feel <span className="italic text-gold-soft">considered</span>
            </h2>
          </Reveal>
          <Reveal delay={150}>
            <Stories />
          </Reveal>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative isolate overflow-hidden py-32">
        <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_50%_100%,rgb(214_189_142/0.35),transparent_70%)]" />
        <Reveal variant="scale" className="mx-auto flex max-w-3xl flex-col items-center gap-8 px-6 text-center">
          <Eyebrow>By invitation, for now</Eyebrow>
          <h2 className="font-display text-5xl leading-[1.05] tracking-tight sm:text-6xl">
            Your next collaboration
            <br />
            <span className="italic text-gold-deep">deserves better.</span>
          </h2>
          <p className="max-w-xl text-lg leading-relaxed text-zinc-600">
            Join the brands and creators shaping how partnerships are done in India. It takes a minute to begin.
          </p>
          <Link
            href="/login"
            data-analytics-cta="closing_begin"
            className="inline-flex h-14 items-center rounded-full bg-gold px-10 text-sm font-medium tracking-wide text-ink shadow-soft transition-all duration-500 ease-[var(--ease-premium)] hover:-translate-y-1 hover:bg-gold-soft hover:shadow-gold"
          >
            Begin with your email
          </Link>
        </Reveal>
      </section>

    </>
  );
}
