import * as Sentry from "@sentry/nextjs";

import { SENTRY_BASE_OPTIONS, SENTRY_DSN } from "@/lib/monitoring";

/** Server-side error monitoring (Node and edge runtimes). Off without NEXT_PUBLIC_SENTRY_DSN. */
export function register() {
  if (SENTRY_DSN) Sentry.init(SENTRY_BASE_OPTIONS);
}

export const onRequestError = Sentry.captureRequestError;
