import Link from "next/link";

import { errorMessage } from "@/lib/errors";

import { ErrorText } from "./ui";

/**
 * A page's data failed to load: say why and, when given, offer a way back (instead of a skeleton that never
 * resolves). Top-level pages such as dashboards omit the link.
 */
export function LoadError({ error, backHref, backLabel }: { error: unknown; backHref?: string; backLabel?: string }) {
  return (
    <div className="flex animate-fade-in flex-col gap-4">
      <ErrorText>{errorMessage(error)}</ErrorText>
      {backHref && (
        <Link href={backHref} className="self-start text-sm text-zinc-500 hover:text-ink">
          ← {backLabel ?? "Back"}
        </Link>
      )}
    </div>
  );
}
