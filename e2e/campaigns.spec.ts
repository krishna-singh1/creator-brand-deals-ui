import { expect, test } from "@playwright/test";

import { createVerifiedCreator } from "./api-fixtures";
import { signInWithPassword, signUp } from "./helpers";

test("brand publishes a campaign; a verified creator applies; the brand approves into a deal", async ({ browser }) => {
  test.setTimeout(180_000); // multi-page flow; first visits compile pages in dev
  const title = `Monsoon chai ritual ${Date.now().toString(36)}`;

  // ── Brand: profile, brief, publish ──
  const brand = await (await browser.newContext()).newPage();
  await signUp(brand, `e2e-cbrand-${Date.now()}@example.com`, "brand");
  await brand.goto("/brand/profile");
  await brand.getByLabel("Brand name").fill("Chai Point Co");
  await brand.getByLabel("Category").selectOption({ label: "Food" });
  await brand.getByLabel("Contact person").fill("Kabir");
  await brand.getByLabel("Contact phone").fill("+919812300001");
  await brand.getByLabel("Work email").fill("kabir@chai.in");
  await brand.getByRole("button", { name: "Save profile" }).click();
  await expect(brand.getByText("Saved.")).toBeVisible();

  await brand.getByRole("link", { name: "Campaigns", exact: true }).click();
  await brand.getByRole("link", { name: "New campaign" }).click();
  await brand.getByLabel("Campaign title").fill(title);
  await brand.getByLabel("Description").fill("Show how our masala chai kit turns a rainy evening into a ritual.");
  await brand.getByRole("button", { name: "Food", exact: true }).click();
  await brand.getByRole("button", { name: "More Instagram Reel" }).click();
  await brand.getByRole("button", { name: "More Instagram Reel" }).click();
  await brand.getByLabel("Cash budget from (₹)").fill("5000");
  await brand.getByLabel("Up to (₹, optional)").fill("9000");
  // Live budget guidance for 10K–50K followers, 2 reels.
  await expect(brand.getByText("Creators in this range usually charge")).toBeVisible();
  await brand.getByRole("button", { name: "Save draft" }).click();

  await expect(brand.getByRole("heading", { name: title })).toBeVisible();
  await brand.getByRole("button", { name: "Publish campaign" }).click();
  await expect(brand.getByText("Live for verified creators")).toBeVisible();

  // ── Creator: feed → detail ──
  const creatorEmail = await createVerifiedCreator("Meera Bakes");
  const creator = await (await browser.newContext()).newPage();
  await signInWithPassword(creator, creatorEmail);
  await expect(creator).toHaveURL(/\/creator$/);
  await creator.getByRole("link", { name: "Campaigns", exact: true }).click();
  await expect(creator.getByRole("heading", { name: "Briefs curated for you" })).toBeVisible();
  await creator.getByLabel("Sort").selectOption("NEWEST");

  const card = creator.getByRole("link").filter({ hasText: title });
  for (let i = 0; i < 10 && !(await card.isVisible()); i++) {
    const more = creator.getByRole("button", { name: "Load more" });
    if (!(await more.isVisible())) break;
    await more.click();
  }
  await expect(card).toBeVisible();
  await expect(card.getByLabel(/% match/)).toBeVisible();
  await card.click();

  await expect(creator.getByRole("heading", { name: title })).toBeVisible();
  await expect(creator.getByText("Apply to this brief")).toBeVisible();
  // 18K followers, 4.11% ER → ₹3,000–₹7,000 per reel, ×2.
  await expect(creator.getByText("₹6,000–₹14,000").first()).toBeVisible();

  // ── Creator applies ──
  await creator.getByLabel("Your pitch").fill(
    "I bake and brew every monsoon evening; my Pune audience loves slow rituals. Two moody reels of the kit in use.",
  );
  await expect(creator.getByLabel(/Instagram Reel \(₹ each/)).toHaveValue("5000");
  await creator.getByLabel(/Instagram Reel \(₹ each/).fill("4500");
  await creator.getByLabel(/I can deliver within the content window/).check();
  await creator.getByRole("button", { name: "Send application" }).click();
  await expect(creator.getByText("Sent. The brand will review it soon.")).toBeVisible();
  await creator.getByRole("link", { name: "Applications", exact: true }).click();
  await expect(creator.getByRole("link").filter({ hasText: title })).toBeVisible();

  // ── Brand is notified, reviews and approves ──
  await brand.reload();
  await expect(brand.getByRole("button", { name: /Notifications, \d+ unread/ })).toBeVisible({ timeout: 15_000 });
  await brand.getByRole("button", { name: /Notifications/ }).click();
  await brand.getByRole("button", { name: new RegExp(`New applicant for ${title}`) }).click();
  await expect(brand).toHaveURL(/\/applicants$/);
  const applicant = brand.getByText("Meera Bakes");
  await expect(applicant).toBeVisible();
  await expect(brand.getByText("₹9,000").first()).toBeVisible();
  await brand.getByRole("button", { name: "Approve", exact: true }).click();
  // The agreed amount starts at the quote and can't be emptied to ₹0.
  const amount = brand.getByLabel("Agreed amount (₹)");
  await expect(amount).toHaveValue("9000");
  await amount.fill("");
  await expect(brand.getByText("Enter an amount above ₹0.")).toBeVisible();
  await amount.fill("9000");
  await brand.getByRole("button", { name: "Approve at ₹9,000" }).click();
  await brand.getByRole("link", { name: /Open deal/ }).click();
  await expect(brand).toHaveURL(/\/deals\/[0-9a-f-]+$/);
  await expect(brand.getByText("The creator is working on it")).toBeVisible();
  await expect(brand.getByText("₹9,000").first()).toBeVisible();

  // ── Creator sees the result ──
  await creator.reload();
  await expect(creator.getByText("Approved. Your deal is ready.")).toBeVisible();
  await creator.getByRole("link", { name: "Deals", exact: true }).click();
  await creator.getByRole("link").filter({ hasText: title }).click();
  await expect(creator.getByText("Time to create")).toBeVisible();
  await expect(creator.getByRole("button", { name: /Notifications, \d+ unread/ })).toBeVisible({ timeout: 15_000 });
});
