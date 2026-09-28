import { expect, test } from "@playwright/test";

import { createApprovedDeal } from "./api-fixtures";
import { signInWithPassword } from "./helpers";

test("brand reopens a closed campaign as a new draft, edits it and publishes", async ({ page }) => {
  test.setTimeout(120_000);
  const title = `Kesar evenings ${Date.now().toString(36)}`;
  const { brandEmail } = await createApprovedDeal(title);

  await signInWithPassword(page, brandEmail);
  await expect(page).toHaveURL(/\/brand$/);
  await page.getByRole("link", { name: "Campaigns", exact: true }).click();
  await page.getByRole("link").filter({ hasText: title }).first().click();
  await expect(page).toHaveURL(/\/brand\/campaigns\/[0-9a-f-]+$/);
  const sourceUrl = page.url();
  const sourceId = sourceUrl.split("/").pop()!;

  // Close the live campaign; the button then offers to reopen it.
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Close applications" }).click();
  await expect(page.getByText("closed", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Reopen as new campaign" }).click();

  // The editor opens on a new draft with everything filled in.
  await expect(page).toHaveURL(/\/brand\/campaigns\/[0-9a-f-]+\/edit\?reopened=1$/);
  expect(page.url()).not.toContain(sourceId);
  await expect(page.getByText("Copied from your earlier campaign")).toBeVisible();
  await expect(page.getByLabel("Campaign title")).toHaveValue(title);
  await page.getByLabel("Campaign title").fill(`${title} (round 2)`);
  await page.getByRole("button", { name: "Save changes" }).click();

  await expect(page.getByRole("heading", { name: `${title} (round 2)` })).toBeVisible();
  await expect(page.getByText("draft", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Publish campaign" }).click();
  await expect(page.getByText("published", { exact: true })).toBeVisible();

  // The original stays closed with its applicants.
  await page.goto(sourceUrl);
  await expect(page.getByText("closed", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Review applicants (1)" })).toBeVisible();
});
