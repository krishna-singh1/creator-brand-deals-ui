import { gunzipSync } from "node:zlib";

import { expect, test } from "@playwright/test";

/**
 * Privacy promises of browser analytics (D-38): page views and landing CTA clicks are sent, without cookies or
 * browser storage and without personal data. Needs a web build with NEXT_PUBLIC_POSTHOG_KEY set (any value), so it
 * only runs when E2E_POSTHOG=1; PostHog itself is never contacted (requests are intercepted here).
 */
test.skip(!process.env.E2E_POSTHOG, "Set E2E_POSTHOG=1 and build the web app with NEXT_PUBLIC_POSTHOG_KEY");
// posthog-js drops events from bots: headless Chromium's user agent says "HeadlessChrome" and automation sets
// navigator.webdriver. Look like a regular desktop Chrome for this test (production keeps bot filtering on).
test.use({
  userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
});

test("landing page views and CTA clicks are captured without cookies, storage or personal data", async ({ page, context }) => {
  await context.addInitScript(() => Object.defineProperty(navigator, "webdriver", { get: () => false }));
  const events: { event: string; properties: Record<string, unknown> }[] = [];
  await page.route(/posthog/, async (route) => {
    const request = route.request();
    const raw = request.postDataBuffer();
    if (raw) {
      // posthog-js gzips batches (?compression=gzip-js); plain JSON otherwise.
      const text = /compression=gzip/.test(request.url()) ? gunzipSync(raw).toString("utf8") : raw.toString("utf8");
      try {
        const parsed = JSON.parse(text);
        for (const e of Array.isArray(parsed) ? parsed : (parsed.batch ?? [parsed])) events.push(e);
      } catch {
        // not an event payload (e.g. config requests)
      }
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });

  await page.goto("/");
  await page.locator('[data-analytics-cta="hero_get_started"]').click();
  await expect(page).toHaveURL(/\/login/);
  await expect.poll(() => events.map((e) => e.event)).toEqual(expect.arrayContaining(["$pageview", "landing_cta_clicked"]));

  const cta = events.find((e) => e.event === "landing_cta_clicked");
  expect(cta?.properties.cta).toBe("hero_get_started");
  expect(JSON.stringify(events)).not.toMatch(/@example\.com|email/i);

  const cookies = await context.cookies();
  expect(cookies.filter((c) => /ph_|posthog/i.test(c.name))).toEqual([]);
  const storageKeys = await page.evaluate(() => [...Object.keys(localStorage), ...Object.keys(sessionStorage)]);
  expect(storageKeys.filter((k) => /ph_|posthog/i.test(k))).toEqual([]);
});
