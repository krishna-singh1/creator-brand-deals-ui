import { withSentryConfig } from "@sentry/nextjs/config";
import type { NextConfig } from "next";

/**
 * Optional same-origin API proxy. When API_ORIGIN is set (e.g. https://creator-brand-deals-production.up.railway.app),
 * requests to /api/v1/* on this app are forwarded to the API, so the browser only ever talks to this origin and the
 * API's session cookies are first-party. Use it when web and API don't share a parent domain (e.g. two
 * *.up.railway.app hosts); then set NEXT_PUBLIC_API_URL=/api/v1. Without API_ORIGIN nothing is proxied and the
 * browser calls NEXT_PUBLIC_API_URL directly (ADR 0008). Read at build time: redeploy after changing it.
 */
const apiOrigin = process.env.API_ORIGIN?.trim().replace(/\/+$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    return apiOrigin ? [{ source: "/api/v1/:path*", destination: `${apiOrigin}/api/v1/:path*` }] : [];
  },
};

/**
 * Sentry (O-21): uploads source maps only when SENTRY_AUTH_TOKEN (+ SENTRY_ORG, SENTRY_PROJECT) is set at build time,
 * e.g. on Vercel; otherwise errors still arrive, with minified stack traces. Maps aren't served to browsers.
 */
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  telemetry: false,
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN, deleteSourcemapsAfterUpload: true },
});
