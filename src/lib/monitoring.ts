import type { Breadcrumb, ErrorEvent } from "@sentry/nextjs";

/**
 * Error monitoring settings shared by the browser, server and edge Sentry setups (O-21 in the API repo's decision log).
 * No DSN = Sentry stays off (local, e2e). Personal data is off, and one-time codes and tokens in URLs (e.g. the
 * Instagram redirect's ?code&state) are filtered before anything is sent.
 */
export const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim() || undefined;

export const SENTRY_BASE_OPTIONS = {
  dsn: SENTRY_DSN,
  enabled: Boolean(SENTRY_DSN),
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.NODE_ENV,
  sendDefaultPii: false,
  // Performance tracing costs quota; raise (e.g. 0.05) when needed.
  tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? 0),
  beforeSend: scrubEvent,
  beforeBreadcrumb: scrubBreadcrumb,
};

const SECRET_HEADERS = new Set(["cookie", "set-cookie", "authorization"]);
const SECRET_PARAMS = /((?:^|[?&#\s])(?:access_token|token|code|state|otp|password|secret)=)[^&#\s]*/gi;

export function scrubUrl<T extends string | undefined>(value: T): T {
  return (value === undefined ? value : value.replace(SECRET_PARAMS, "$1[Filtered]")) as T;
}

function scrubEvent(event: ErrorEvent): ErrorEvent {
  if (event.request) {
    event.request.url = scrubUrl(event.request.url);
    event.request.query_string = typeof event.request.query_string === "string" ? scrubUrl(event.request.query_string) : undefined;
    event.request.cookies = undefined;
    event.request.data = undefined;
    if (event.request.headers) {
      event.request.headers = Object.fromEntries(
        Object.entries(event.request.headers).filter(([name]) => !SECRET_HEADERS.has(name.toLowerCase())),
      );
    }
  }
  return event;
}

function scrubBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb {
  if (breadcrumb.message) breadcrumb.message = scrubUrl(breadcrumb.message);
  if (breadcrumb.data) {
    for (const [key, value] of Object.entries(breadcrumb.data)) {
      if (typeof value === "string") breadcrumb.data[key] = scrubUrl(value);
    }
  }
  return breadcrumb;
}
