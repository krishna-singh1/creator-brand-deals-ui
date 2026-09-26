"use client";

import { useQuery } from "@tanstack/react-query";

import { Skeleton } from "@/components/ui";
import { api, unwrap } from "@/lib/api/client";

/** Live catalog from the API: the niches we are curating first. */
export function LaunchNiches() {
  const { data, isPending, isError } = useQuery({
    queryKey: ["catalog", "categories"],
    queryFn: () => unwrap(api.GET("/catalog/categories")),
  });

  if (isPending) {
    return (
      <div className="flex flex-wrap justify-center gap-3">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-11 w-36 rounded-full" />
        ))}
      </div>
    );
  }
  if (isError) return <p className="text-center text-sm text-zinc-500">Couldn&apos;t reach the API.</p>;

  return (
    <ul className="flex flex-wrap justify-center gap-3">
      {data.map((c, i) => (
        <li
          key={c.id}
          className="animate-fade-up rounded-full border border-zinc-300/80 bg-white/70 px-5 py-2.5 font-display text-lg text-ink shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:border-gold hover:text-gold-deep"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          {c.name}
        </li>
      ))}
    </ul>
  );
}
