"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { api, unwrap } from "@/lib/api/client";
import { isYourMove, NEXT_ACTION_COPY } from "@/lib/deals";

import { Card } from "./ui";

/** Home-page card: active deals where it's the viewer's turn, each linking straight to the deal. Hidden when none. */
export function DealsNeedingYou({ partner }: { partner: "brand" | "creator" }) {
  const { data } = useQuery({
    queryKey: ["deals", "list", "home"],
    queryFn: () => unwrap(api.GET("/deals", { params: { query: { limit: 50 } } })),
  });
  const mine = (data?.items ?? []).filter(isYourMove);
  if (mine.length === 0) return null;
  return (
    <Card className="animate-fade-up">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-gold-deep">Your move</p>
          <p className="mt-2 font-display text-2xl tracking-tight text-ink">
            {mine.length === 1 ? "One deal is waiting on you" : `${mine.length} deals are waiting on you`}
          </p>
        </div>
        <Link href="/deals" className="link-underline shrink-0 text-sm text-zinc-600 hover:text-ink">
          All deals
        </Link>
      </div>
      <ul className="mt-5 flex flex-col gap-3">
        {mine.slice(0, 5).map((d) => (
          <li key={d.id}>
            <Link
              href={`/deals/${d.id}`}
              className="group flex items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-ivory/60 px-5 py-4 transition-all duration-500 ease-[var(--ease-premium)] hover:-translate-y-0.5 hover:border-gold/50 hover:bg-white hover:shadow-lift"
            >
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[15px] font-medium text-ink">{NEXT_ACTION_COPY[d.nextAction!]?.title ?? "Open the deal"}</span>
                <span className="truncate text-sm text-zinc-600">
                  {d.campaignTitle} · {partner === "brand" ? d.brand.brandName : d.creator.displayName}
                </span>
              </span>
              <span
                aria-hidden
                className="grid size-9 shrink-0 place-items-center rounded-full border border-zinc-300 text-ink transition-all duration-500 group-hover:translate-x-1 group-hover:border-ink group-hover:bg-ink group-hover:text-ivory"
              >
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
