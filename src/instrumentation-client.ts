import * as Sentry from "@sentry/nextjs";

import { initAnalytics } from "@/lib/analytics";
import { SENTRY_BASE_OPTIONS, SENTRY_DSN } from "@/lib/monitoring";

// Browser error monitoring. Session replay records only sessions that hit an error, with every text, input and media
// masked, so nothing a user types or sees is sent (see the Privacy Policy).
if (SENTRY_DSN) {
  Sentry.init({
    ...SENTRY_BASE_OPTIONS,
    integrations: [Sentry.replayIntegration({ maskAllText: true, maskAllInputs: true, blockAllMedia: true })],
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
  });
}

// Product analytics (off without NEXT_PUBLIC_POSTHOG_KEY): page views and a few browser-only events.
initAnalytics();

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
