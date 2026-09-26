"use client";

import { useQuery } from "@tanstack/react-query";

import { api, unwrap } from "@/lib/api/client";

/** Public catalog call: proves the browser → API (separate origin) path works. */
export function LaunchNiches() {
  const { data, isPending, isError } = useQuery({
    queryKey: ["catalog", "categories"],
    queryFn: () => unwrap(api.GET("/catalog/categories")),
  });

  if (isPending) return <p className="text-sm text-zinc-500">Loading niches…</p>;
  if (isError) return <p className="text-sm text-red-600">Couldn&apos;t reach the API.</p>;

  return (
    <ul className="flex flex-wrap gap-2">
      {data.map((c) => (
        <li key={c.id} className="rounded-full border border-zinc-300 px-3 py-1 text-sm">
          {c.name}
        </li>
      ))}
    </ul>
  );
}
