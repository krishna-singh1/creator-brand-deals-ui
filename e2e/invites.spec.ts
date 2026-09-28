import { expect, test } from "@playwright/test";

import { createBrandWithCampaign, createVerifiedCreator } from "./api-fixtures";
import { signInWithPassword } from "./helpers";

test("brand finds a creator and invites them; the creator accepts with a pitch", async ({ browser }) => {
  test.setTimeout(150_000);
  const suffix = Date.now().toString(36);
  const title = `Kesar lassi ${suffix}`;
  const creatorName = `Ishita ${suffix}`;
  const { brandEmail } = await createBrandWithCampaign(title);
  const creatorEmail = await createVerifiedCreator(creatorName);

  // ── Brand: discover → profile → invite ──
  const brand = await (await browser.newContext()).newPage();
  await signInWithPassword(brand, brandEmail);
  await expect(brand).toHaveURL(/\/brand$/);
  await brand.getByRole("link", { name: "Creators", exact: true }).click();
  await expect(brand.getByRole("heading", { name: "Find creators" })).toBeVisible();
  await brand.getByLabel("Search by name or handle").fill(creatorName);
  await brand.getByRole("link").filter({ hasText: creatorName }).click();
  await expect(brand.getByRole("heading", { name: creatorName })).toBeVisible();
  await expect(brand.getByText("Accounts")).toBeVisible();
  await expect(brand.getByLabel("Campaign")).toHaveValue(/.+/);
  await brand.getByLabel("Note (optional)").fill("Your monsoon reels are lovely. Would you create one for us?");
  await brand.getByRole("button", { name: "Send invite" }).click();
  await expect(brand.getByText("Invite sent.")).toBeVisible();

  // ── Creator: notification → campaign → accept with pitch and quote ──
  const creator = await (await browser.newContext()).newPage();
  await signInWithPassword(creator, creatorEmail);
  await expect(creator).toHaveURL(/\/creator$/);
  await creator.getByRole("button", { name: /Notifications, \d+ unread/ }).click();
  await creator.getByRole("button", { name: /Saffron & Co invited you/ }).click();
  await expect(creator.getByText("Saffron & Co invited you")).toBeVisible();
  await expect(creator.getByText("Your monsoon reels are lovely.", { exact: false })).toBeVisible();
  await creator.getByLabel("Your pitch").fill("Monsoon evenings and kesar lassi are my feed's favourite pairing. One slow, cosy reel from my balcony.");
  await creator.getByLabel(/Instagram Reel/).fill("6000");
  await creator.getByLabel(/I can deliver within the content window/).check();
  await creator.getByRole("button", { name: "Accept invite and send" }).click();
  await expect(creator.getByText("Your application")).toBeVisible();
  await expect(creator.getByText("₹6,000")).toBeVisible();

  // ── Brand: the invitee is now an applicant ──
  await brand.goto("/brand/campaigns");
  await brand.getByRole("link").filter({ hasText: title }).first().click();
  await brand.getByRole("link", { name: /Review applicants/ }).click();
  await expect(brand.getByText(creatorName)).toBeVisible();
  await expect(brand.getByText("₹6,000").first()).toBeVisible();
});
