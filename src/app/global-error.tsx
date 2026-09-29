"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

import "./globals.css";

/** Last-resort error page (replaces the root layout when it crashes). Reports the error and offers a retry. */
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-ivory px-6 font-sans text-ink">
        <title>Something went wrong · BrandDeal</title>
        <main className="flex max-w-md flex-col gap-4 text-center">
          <h1 className="font-display text-4xl tracking-tight">Something went wrong</h1>
          <p className="text-zinc-600">
            We&apos;ve been told about it. Try again, and if it keeps happening, reload the page in a minute.
          </p>
          <button
            type="button"
            onClick={() => retry()}
            className="mx-auto rounded-full bg-ink px-6 py-3 text-sm font-medium text-ivory transition-transform hover:-translate-y-0.5"
          >
            Try again
          </button>
          {error.digest && <p className="text-xs text-zinc-500">Reference: {error.digest}</p>}
        </main>
      </body>
    </html>
  );
}
