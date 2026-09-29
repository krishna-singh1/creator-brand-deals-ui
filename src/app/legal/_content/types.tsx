import type { ReactNode } from "react";

/** A legal document: rendered by /legal/[slug] with a table of contents built from its sections. */
export type LegalDoc = {
  title: string;
  /** One or two sentences in plain language shown above the sections. */
  summary: string;
  /** The policy version users accept (matches the API), or the last-updated date for documents nobody accepts. */
  version: string;
  sections: { id: string; heading: string; body: ReactNode }[];
};

export function P({ children }: { children: ReactNode }) {
  return <p className="leading-relaxed text-zinc-700">{children}</p>;
}

export function List({ items }: { items: ReactNode[] }) {
  return (
    <ul className="flex list-disc flex-col gap-2 pl-5 leading-relaxed text-zinc-700">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

export function Strong({ children }: { children: ReactNode }) {
  return <strong className="font-medium text-ink">{children}</strong>;
}
