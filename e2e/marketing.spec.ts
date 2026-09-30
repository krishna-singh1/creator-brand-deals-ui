import { expect, test } from "@playwright/test";

import { PRODUCT } from "@/lib/product";

/** Public, static pages: these need no API and no signed-in state. */

test("the landing page sends each audience to its own page", async ({ page }) => {
  await page.goto("/");
  const how = page.locator("#how");
  await expect(how.getByRole("link", { name: /How it works for brands/ })).toHaveAttribute("href", "/brands");
  await expect(how.getByRole("link", { name: /How it works for creators/ })).toHaveAttribute("href", "/creators");

  await how.getByRole("link", { name: /How it works for creators/ }).click();
  await expect(page).toHaveURL(/\/creators$/);
  await expect(page.getByRole("heading", { level: 1, name: /Your work, valued properly/ })).toBeVisible();
});

test("the creator page explains the steps and is honest about payment", async ({ page }) => {
  await page.goto("/creators");
  await expect(page).toHaveTitle(/For creators/);
  for (const step of ["Present your craft", "Get verified", "Choose your collaborations"]) {
    await expect(page.getByRole("heading", { name: step })).toBeVisible();
  }
  // Payments are off-platform (D-01), so the page must say so rather than implying we hold the money.
  await expect(page.getByText(`${PRODUCT.name} does not hold your money`)).toBeVisible();
  await expect(page.getByText("no commission during the beta")).toBeVisible();
});

test("the brand page explains the steps and that publishing waits on verification", async ({ page }) => {
  await page.goto("/brands");
  await expect(page).toHaveTitle(/For brands/);
  for (const step of ["Brief with intent", "Receive considered applications", "Approve and collaborate"]) {
    await expect(page.getByRole("heading", { name: step })).toBeVisible();
  }
  // Brands are verified before a campaign can go live (D-34).
  await expect(page.getByText("Brands are verified by our team")).toBeVisible();
});

test("the shared header and footer work from a secondary page", async ({ page }) => {
  await page.goto("/brands");
  await expect(page.getByRole("contentinfo").getByRole("link", { name: "Terms", exact: true })).toBeVisible();

  // Nav anchors are absolute, so they go back to the landing page instead of doing nothing here.
  await page.getByRole("navigation").getByRole("link", { name: "How it works" }).first().click();
  await expect(page).toHaveURL(/\/#how$/);
  await expect(page.locator("#how")).toBeInViewport();
});
