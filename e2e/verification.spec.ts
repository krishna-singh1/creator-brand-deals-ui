import { expect, test } from "@playwright/test";

import { ADMIN_STATE } from "./api-fixtures";
import { PNG, signUp } from "./helpers";

test("creator completes profile, submits proofs, admin approves, creator is verified", async ({ browser }) => {
  test.setTimeout(180_000); // long multi-page flow; first visits compile pages in dev
  const creatorEmail = `e2e-verify-${Date.now()}@example.com`;
  const handle = `e2e.${Date.now().toString(36)}`;

  // ── Creator ──
  const creator = await (await browser.newContext()).newPage();
  await signUp(creator, creatorEmail, "creator");
  await creator.getByRole("link", { name: "Complete your creator profile" }).click();
  await expect(creator).toHaveURL(/\/creator\/profile$/);

  await creator.locator('input[type="file"]').first().setInputFiles(PNG);
  await expect(creator.getByText("Uploading…")).toBeHidden();
  await creator.getByLabel("Display name").fill("Riya Eats");
  await creator.getByLabel("Full name").fill("Riya Kapoor");
  await creator.getByLabel("Date of birth").fill("1998-04-12");
  await creator.getByLabel("City").selectOption({ label: "Pune, Maharashtra" });
  await creator.getByLabel("Mobile number").fill("+919876500001");
  await creator.getByLabel("Contact email").fill("riya@example.com");
  await creator.getByRole("button", { name: "Food" }).click();
  await creator.getByLabel("English").check();
  await creator.getByRole("button", { name: "Save details" }).click();
  await expect(creator.getByText("Saved.").first()).toBeVisible();

  await creator.getByRole("button", { name: "+ Add an account" }).click();
  await creator.getByLabel("Instagram username").fill(`@${handle}`);
  await creator.getByLabel("Followers").fill("18000");
  await creator.getByLabel("Avg likes per post").fill("700");
  await creator.getByLabel("Avg comments per post").fill("40");
  await creator.getByRole("button", { name: "Save account" }).click();
  await expect(creator.getByRole("link", { name: `@${handle}` })).toBeVisible();

  // Rate card shows the doc example suggestion (T2, 4.11% ER → ₹3,000–₹7,000 for a Reel).
  await expect(creator.getByText("Suggested ₹3,000–₹7,000 (est.)")).toBeVisible();
  await creator.getByPlaceholder("₹").first().fill("5000");
  await creator.getByRole("button", { name: "Save rates" }).click();
  await expect(creator.getByText("Saved.").last()).toBeVisible();

  await creator.getByRole("link", { name: /submit for verification/ }).click();
  await creator.getByLabel("Insights screenshots").setInputFiles([PNG]);
  await creator.getByRole("button", { name: "Submit for review" }).click();
  await expect(creator.getByText("Our team usually reviews within 48 hours")).toBeVisible();

  // ── Admin ──
  const admin = await (await browser.newContext({ storageState: ADMIN_STATE })).newPage();
  await admin.goto("/admin/verifications");
  await expect(admin).toHaveURL(/\/admin\/verifications$/);
  let row = admin.getByRole("link", { name: "Riya Eats" }).last();
  for (let i = 0; i < 10 && !(await row.isVisible()); i++) {
    const more = admin.getByRole("button", { name: "Load more" });
    if (!(await more.isVisible())) break;
    await more.click();
  }
  row = admin.getByRole("row").filter({ hasText: handle }).getByRole("link");
  await row.click();
  await expect(admin.getByRole("heading", { name: "Riya Eats" })).toBeVisible();
  await expect(admin.getByAltText("Insights screenshot")).toBeVisible();

  const approve = admin.getByRole("button", { name: "Approve creator" });
  await expect(approve).toBeDisabled();
  for (const box of await admin.locator('input[type="checkbox"]').all()) await box.check();
  await approve.click();
  await expect(admin.getByText(/^Reviewed/)).toBeVisible();

  // ── Creator sees the result ──
  await creator.goto("/creator/verification");
  await expect(creator.getByText("You're verified.")).toBeVisible();
  await creator.goto("/creator/profile");
  await expect(creator.getByText("Suggested ₹3,000–₹7,000").first()).toBeVisible();
  await expect(creator.getByText("(est.)")).toHaveCount(0);
});

test("brand completes profile with logo", async ({ page }) => {
  await signUp(page, `e2e-brand-${Date.now()}@example.com`, "brand");
  await page.getByRole("link", { name: "Complete your brand profile" }).click();
  await page.locator('input[type="file"]').setInputFiles(PNG);
  await expect(page.getByText("Uploading…")).toBeHidden();
  await page.getByLabel("Brand name").fill("Chai Point Co");
  await page.getByLabel("Category").selectOption({ label: "Food" });
  await page.getByLabel("Contact person").fill("Kabir");
  await page.getByLabel("Contact phone").fill("+919812300001");
  await page.getByLabel("Work email").fill("kabir@chai.in");
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.getByText("Saved.")).toBeVisible();
  await page.getByRole("link", { name: "Home" }).click();
  await expect(page.getByRole("link", { name: "Post your first campaign" })).toBeVisible();
  // A complete profile goes to BrandDeal for verification.
  await expect(page.getByText("We're verifying your brand")).toBeVisible();
});
