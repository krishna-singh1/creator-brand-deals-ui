import Link from "next/link";
import type { ReactNode } from "react";

import { Counter } from "./motion";
import { Card } from "./ui";

/** "Good morning" / "Good afternoon" / "Good evening" by the hour in India. */
export function greeting(now = new Date()) {
  const hour = Number(now.toLocaleString("en-IN", { hour: "numeric", hourCycle: "h23", timeZone: "Asia/Kolkata" }));
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
}

export type Kpi = { label: string; value: number; href?: string; format?: (n: number) => string; highlight?: boolean };

/** Dark hero at the top of a role home: greeting, status, one primary action and the key numbers. */
export function DashboardHero({
  eyebrow,
  title,
  subtitle,
  badge,
  action,
  kpis,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  badge?: ReactNode;
  action?: { href: string; label: string };
  kpis?: Kpi[];
}) {
  return (
    <section className="noir-panel grain animate-fade-up overflow-hidden rounded-[2rem] p-7 shadow-noir sm:p-10">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="flex max-w-2xl flex-col gap-3">
          <span className="inline-flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.28em] text-gold-soft">
            <span aria-hidden className="h-px w-8 bg-gold/60" />
            {eyebrow}
          </span>
          <h1 className="font-display text-[2.1rem] leading-tight tracking-tight text-ivory sm:text-5xl">{title}</h1>
          <p className="text-[15px] leading-relaxed text-ivory/70">{subtitle}</p>
          {badge && <div className="mt-1">{badge}</div>}
        </div>
        {action && (
          <Link
            href={action.href}
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-gold px-6 text-sm font-medium text-ink transition-all duration-300 hover:-translate-y-0.5 hover:bg-gold-soft hover:shadow-gold"
          >
            {action.label}
            <span aria-hidden>→</span>
          </Link>
        )}
      </div>
      {kpis && kpis.length > 0 && (
        <dl
          className={`mt-8 grid gap-px overflow-hidden rounded-2xl bg-white/10 sm:mt-10 ${
            kpis.length === 3 ? "grid-cols-3" : "grid-cols-2 lg:grid-cols-4"
          }`}
        >
          {kpis.map((k) => (
            <KpiCell key={k.label} kpi={k} />
          ))}
        </dl>
      )}
    </section>
  );
}

function KpiCell({ kpi }: { kpi: Kpi }) {
  const body = (
    <>
      <dt className="text-[10px] uppercase leading-snug tracking-[0.1em] text-ivory/55 sm:text-[11px] sm:tracking-[0.2em]">{kpi.label}</dt>
      <dd className={`mt-2 font-display text-3xl tracking-tight sm:text-4xl ${kpi.highlight ? "text-gold-soft" : "text-ivory"}`}>
        {kpi.format ? kpi.format(kpi.value) : <Counter value={kpi.value} duration={900} />}
      </dd>
    </>
  );
  const cell = "flex flex-col bg-noir/80 px-4 py-4 transition-colors duration-300 sm:px-5";
  return kpi.href ? (
    <Link href={kpi.href} className={`${cell} hover:bg-white/5`}>
      {body}
    </Link>
  ) : (
    <div className={cell}>{body}</div>
  );
}

export type ChecklistStep = { label: string; hint: string; href: string; state: "done" | "current" | "waiting" | "todo" };

/** Getting-started checklist with a progress bar; the first unfinished step is the call to action. */
export function ProgressChecklist({ title, steps }: { title: string; steps: ChecklistStep[] }) {
  const done = steps.filter((s) => s.state === "done").length;
  return (
    <Card className="animate-fade-up">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-gold-deep">Getting started</p>
          <p className="mt-2 font-display text-2xl tracking-tight text-ink">{title}</p>
        </div>
        <p className="text-sm text-zinc-500">
          {done} of {steps.length} done
        </p>
      </div>
      <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-cream" aria-hidden>
        <div
          className="h-full rounded-full bg-gradient-to-r from-gold-deep via-gold to-gold-soft transition-[width] duration-1000 ease-[var(--ease-premium)]"
          style={{ width: `${(done / steps.length) * 100}%` }}
        />
      </div>
      <ol className="mt-6 grid gap-3 sm:grid-cols-2">
        {steps.map((s, i) => (
          <li key={s.label}>
            <Link
              href={s.href}
              className={`group flex h-full items-start gap-4 rounded-2xl border px-5 py-4 transition-all duration-500 ease-[var(--ease-premium)] hover:-translate-y-0.5 hover:shadow-lift ${
                s.state === "current" ? "border-gold/50 bg-white shadow-soft" : "border-zinc-200 bg-ivory/60 hover:bg-white"
              }`}
            >
              <span
                aria-hidden
                className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-full text-xs font-medium ${
                  s.state === "done"
                    ? "bg-sage text-ivory"
                    : s.state === "waiting"
                      ? "bg-ochre-soft text-ochre ring-1 ring-ochre/30"
                      : s.state === "current"
                        ? "bg-ink text-gold-soft"
                        : "border border-zinc-300 text-zinc-500"
                }`}
              >
                {s.state === "done" ? "✓" : i + 1}
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className={`text-[15px] font-medium ${s.state === "done" ? "text-zinc-500 line-through decoration-zinc-300" : "text-ink"}`}>
                  {s.label}
                  <span className="sr-only">{s.state === "done" ? " (done)" : s.state === "waiting" ? " (in review)" : ""}</span>
                </span>
                <span className="text-sm text-zinc-600">{s.hint}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </Card>
  );
}
