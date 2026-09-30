import posthog from "posthog-js";

import type { Me } from "./api/client";

/**
 * Browser product analytics (PostHog, D-38): page views plus a few events that only the browser sees (landing CTA
 * clicks, sign-up started). Business numbers (funnels, deal economics) come from our own database on the admin
 * Insights page, not from here. Off unless NEXT_PUBLIC_POSTHOG_KEY is set.
 *
 * Privacy: no cookies or browser storage (in-memory only), no autocapture, no session recording, no surveys; after
 * sign-in events carry the account ID (a UUID) and role, never email or name. Admins aren't tracked.
 */
const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim() || undefined;
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || "https://eu.i.posthog.com";

/** Browser-only events. Keep this list in sync with docs/10-contracts.md §6 in the API repo. */
export type AnalyticsEvent =
  | { name: "landing_cta_clicked"; props: { cta: string } }
  | { name: "signup_started"; props: { method: "password" } };

let started = false;

export function initAnalytics() {
  if (!KEY || started || typeof window === "undefined") return;
  started = true;
  posthog.init(KEY, {
    api_host: HOST,
    persistence: "memory",
    autocapture: false,
    capture_pageview: "history_change",
    capture_pageleave: false,
    disable_session_recording: true,
    disable_surveys: true,
    capture_exceptions: false,
    capture_heatmaps: false,
    capture_dead_clicks: false,
    rageclick: false,
    person_profiles: "identified_only",
    advanced_disable_flags: true,
  });
  // Landing CTAs are server-rendered links: mark them with data-analytics-cta="<name>" instead of click handlers.
  document.addEventListener("click", (event) => {
    const cta = (event.target as Element | null)?.closest?.("[data-analytics-cta]")?.getAttribute("data-analytics-cta");
    if (cta) track({ name: "landing_cta_clicked", props: { cta } });
  });
}

export function track(event: AnalyticsEvent) {
  if (started) posthog.capture(event.name, event.props);
}

/** Link events to the signed-in account (ID + role only); admins opt out entirely. Signed out → forget the user. */
export function identifyUser(me: Me | null | undefined) {
  if (!started || me === undefined) return;
  if (me === null) {
    posthog.reset();
    return;
  }
  if (me.role === "ADMIN") {
    posthog.opt_out_capturing();
    return;
  }
  if (posthog.has_opted_out_capturing()) posthog.opt_in_capturing();
  posthog.identify(me.id, { role: me.role ?? "NONE" });
}
