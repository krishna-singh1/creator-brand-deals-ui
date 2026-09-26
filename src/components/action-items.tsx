import Link from "next/link";

import type { components } from "@/lib/api/client";

import { Card } from "./ui";

type ActionItem = components["schemas"]["ActionItem"];

/** "What to do next" list from the role dashboards. */
export function ActionItems({ items, emptyText }: { items: ActionItem[]; emptyText: string }) {
  return (
    <Card>
      <h2 className="mb-3 font-medium">Next steps</h2>
      {items.length === 0 ? (
        <p className="text-sm text-zinc-600">{emptyText}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li key={item.type}>
              <Link href={item.link} className="flex items-center justify-between rounded-lg border border-zinc-200 px-4 py-3 text-sm hover:border-zinc-900">
                {item.title}
                <span aria-hidden>→</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
