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

export default nextConfig;
