import { expect, test } from "@playwright/test";

import { acceptConsents, signUpToAgreements } from "./helpers";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

test("the agreements step links to the real documents at the version being accepted, and accepting records it", async ({ page }) => {
  await signUpToAgreements(page, `e2e-legal-${Date.now()}@example.com`, "brand");

  // What the API asks this user to accept (TERMS, PRIVACY, BRAND_CODE at their current versions).
  const me = await (await page.request.get(`${API_URL}/auth/me`)).json();
  const pending: { type: string; version: string }[] = me.onboarding.pendingConsents;
  expect(pending.map((p) => p.type)).toEqual(expect.arrayContaining(["TERMS", "PRIVACY", "BRAND_CODE"]));

  const documents: Record<string, { link: string; heading: string }> = {
    TERMS: { link: "Terms of Service", heading: "Terms of Service" },
    PRIVACY: { link: "Privacy Policy", heading: "Privacy Policy" },
    BRAND_CODE: { link: "Brand Code of Conduct", heading: "Brand Code of Conduct" },
  };
  for (const { type, version } of pending.filter((p) => documents[p.type])) {
    const [doc] = await Promise.all([
      page.waitForEvent("popup"),
      page.getByRole("link", { name: documents[type].link }).click(),
    ]);
    await expect(doc.getByRole("heading", { level: 1, name: documents[type].heading })).toBeVisible();
    // The web page shows the same version the API records, so users accept exactly what they read.
    await expect(doc.getByText(`Version ${version}`)).toBeVisible();
    await expect(doc.getByRole("navigation", { name: "Contents" })).toBeVisible();
    await doc.close();
  }

  await acceptConsents(page);
  await expect(page).toHaveURL(/\/brand$/);
  const after = await (await page.request.get(`${API_URL}/auth/me`)).json();
  expect(after.onboarding.consentsAccepted).toBe(true);
  expect(after.onboarding.pendingConsents).toEqual([]);
});

test("every legal page has real content and the footer links to all of them", async ({ page }) => {
  await page.goto("/");
  const footer = page.getByRole("contentinfo");
  for (const name of ["Terms", "Privacy", "Creator code", "Brand code", "Grievance officer", "Deleting your data"]) {
    await expect(footer.getByRole("link", { name, exact: true })).toBeVisible();
  }

  for (const slug of ["terms", "privacy", "creator-code", "brand-code", "grievance", "data-deletion"]) {
    await page.goto(`/legal/${slug}`);
    await expect(page.getByRole("navigation", { name: "Contents" })).toBeVisible();
    await expect(page.getByText("will be published here before launch")).toHaveCount(0);
    expect(await page.locator("section").count()).toBeGreaterThan(2);
  }
  await page.goto("/legal/grievance");
  await expect(page.getByText("We acknowledge every complaint within 24 hours.")).toBeVisible();
  await page.goto("/legal/creator-code");
  await expect(page.getByRole("heading", { name: "2. How to disclose" })).toBeVisible();
});
