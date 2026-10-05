import Link from "next/link";

import type { components } from "@/lib/api/client";
import { daysLeft, formatDate } from "@/lib/campaigns";

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
            <li key={`${item.type}-${item.link}`} className="animate-fade-up" style={{ animationDelay: `${120 + i * 90}ms` }}>
              <Link
                href={item.link}
                className="group flex items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-ivory/60 px-6 py-5 transition-all duration-500 ease-[var(--ease-premium)] hover:-translate-y-0.5 hover:border-gold/50 hover:bg-white hover:shadow-lift"
              >
                <span className="flex items-center gap-4">
                  <span className="font-display text-lg italic text-gold">{String(i + 1).padStart(2, "0")}</span>
                  <span className="flex flex-col gap-0.5">
                    <span className="font-display text-xl tracking-tight text-ink">{item.title}</span>
                    {item.dueDate && <Due date={item.dueDate} />}
                  </span>
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

function Due({ date }: { date: string }) {
  const d = daysLeft(date);
  const tone = d < 0 ? "text-red-700" : d <= 2 ? "text-amber-800" : "text-zinc-500";
  const text = d < 0 ? `Overdue since ${formatDate(date)}` : d === 0 ? "Due today" : `Due ${formatDate(date)} · ${d} day${d === 1 ? "" : "s"} left`;
  return <span className={`text-xs uppercase tracking-[0.12em] ${tone}`}>{text}</span>;
}
