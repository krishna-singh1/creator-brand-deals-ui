import { expect, test } from "@playwright/test";

import { ADMIN_STATE, createApprovedDeal } from "./api-fixtures";
import { signInWithPassword } from "./helpers";

test("admin console: suspend and reinstate a user, take down a campaign, see deals, audit and pricing", async ({ browser }) => {
  test.setTimeout(180_000);
  const title = `Kesar pista ${Date.now().toString(36)}`;
  const { creatorEmail } = await createApprovedDeal(title);
  // Unique per run: the audit log keeps entries from earlier runs.
  const suspendReason = `Fake engagement reported (${title})`;
  const takedownReason = `Makes medical claims (${title})`;

  const creator = await (await browser.newContext()).newPage();
  await signInWithPassword(creator, creatorEmail);
  await expect(creator).toHaveURL(/\/creator$/);

  const admin = await (await browser.newContext({ storageState: ADMIN_STATE })).newPage();
  await admin.goto("/admin");
  await expect(admin.getByRole("heading", { name: "Marketplace at a glance" })).toBeVisible();
  await expect(admin.getByText("Pending verifications")).toBeVisible();

  // ── Users: find the creator, suspend, and they're locked out ──
  await admin.getByRole("link", { name: "Users" }).click();
  await admin.getByLabel("Search users").fill(creatorEmail);
  await admin.getByRole("button", { name: "Search" }).click();
  const userRow = admin.getByRole("row").filter({ hasText: creatorEmail });
  await expect(userRow.getByText("active", { exact: true })).toBeVisible();
  await userRow.getByRole("button", { name: "Suspend" }).click();
  await userRow.getByLabel("Why are you suspending this account?").fill(suspendReason);
  await userRow.getByRole("button", { name: "Suspend account" }).click();
  await expect(userRow.getByText("suspended", { exact: true })).toBeVisible();

  await creator.reload();
  await expect(creator.getByText("This account is suspended.")).toBeVisible();

  await userRow.getByRole("button", { name: "Reinstate" }).click();
  await expect(userRow.getByText("active", { exact: true })).toBeVisible();

  // ── Campaigns: take the brief down ──
  await admin.getByRole("link", { name: "Campaigns" }).click();
  await admin.getByLabel("Search campaigns").fill(title);
  await admin.getByRole("button", { name: "Search" }).click();
  const campaignRow = admin.getByRole("row").filter({ hasText: title });
  await campaignRow.getByRole("button", { name: "Take down" }).click();
  await campaignRow.getByLabel(/Which guideline does it break/).fill(takedownReason);
  await campaignRow.getByRole("button", { name: "Take down campaign" }).click();
  await admin.getByLabel("Status").selectOption("UNPUBLISHED_BY_ADMIN");
  await expect(admin.getByRole("row").filter({ hasText: title }).getByText("unpublished by admin")).toBeVisible();

  // ── Deals and audit trail ──
  await admin.getByRole("link", { name: "Deals" }).click();
  await expect(admin.getByRole("row").filter({ hasText: title })).toBeVisible();
  await admin.getByRole("link", { name: "Audit log" }).click();
  await expect(admin.getByText(`“${takedownReason}”`)).toBeVisible();
  await expect(admin.getByText(`“${suspendReason}”`)).toBeVisible();

  // ── Pricing: edits stay a draft until published ──
  await admin.getByRole("link", { name: "Pricing" }).click();
  const publish = admin.getByRole("button", { name: /Publish version/ });
  await expect(publish).toBeDisabled();
  await admin.getByLabel("IG_REEL T2 max rupees").fill("9000");
  await expect(publish).toBeEnabled();
  await admin.getByRole("button", { name: "Discard changes" }).click();
  await expect(publish).toBeDisabled();

  // ── The creator can't delete their account while the deal is active ──
  await creator.goto("/account");
  await creator.getByLabel("Type DELETE to confirm").fill("DELETE");
  await creator.getByRole("button", { name: "Delete my account" }).click();
  await expect(creator.getByText("You have 1 active deal. Complete or cancel it before deleting your account.")).toBeVisible();
});
