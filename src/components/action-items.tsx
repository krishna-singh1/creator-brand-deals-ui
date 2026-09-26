import Link from "next/link";

import type { components } from "@/lib/api/client";

import { Card } from "./ui";

type ActionItem = components["schemas"]["ActionItem"];

/** "What to do next" list from the role dashboards, each step a lifting, arrowed row. */
export function ActionItems({ items, emptyText }: { items: ActionItem[]; emptyText: string }) {
  return (
    <Card className="animate-fade-up">
      <p className="mb-5 text-xs font-medium uppercase tracking-[0.24em] text-gold-deep">Next steps</p>
      {items.length === 0 ? (
        <p className="font-display text-xl leading-relaxed text-zinc-700">{emptyText}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item, i) => (
            <li key={item.type} className="animate-fade-up" style={{ animationDelay: `${120 + i * 90}ms` }}>
              <Link
                href={item.link}
                className="group flex items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-ivory/60 px-6 py-5 transition-all duration-500 ease-[var(--ease-premium)] hover:-translate-y-0.5 hover:border-gold/50 hover:bg-white hover:shadow-lift"
              >
                <span className="flex items-center gap-4">
                  <span className="font-display text-lg italic text-gold">0{i + 1}</span>
                  <span className="font-display text-xl tracking-tight text-ink">{item.title}</span>
                </span>
                <span
                  aria-hidden
                  className="grid size-10 place-items-center rounded-full border border-zinc-300 text-ink transition-all duration-500 group-hover:translate-x-1 group-hover:border-ink group-hover:bg-ink group-hover:text-ivory"
                >
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
