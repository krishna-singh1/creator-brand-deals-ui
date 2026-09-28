import { expect, test } from "@playwright/test";

import { ADMIN_STATE, createApprovedDeal } from "./api-fixtures";
import { signInWithPassword } from "./helpers";

test("a creator reports a problem, the deal pauses, and an admin resolves it", async ({ browser }) => {
  test.setTimeout(120_000);
  const title = `Mango kulfi ${Date.now().toString(36)}`;
  const { brandEmail, creatorEmail, dealId } = await createApprovedDeal(title);

  const creator = await (await browser.newContext()).newPage();
  await signInWithPassword(creator, creatorEmail);
  await expect(creator).toHaveURL(/\/creator$/);
  await creator.goto(`/deals/${dealId}`);
  await creator.getByRole("button", { name: "Report a problem to BrandDeal" }).click();
  await creator.getByLabel("What went wrong").selectOption("PRODUCT_NOT_RECEIVED");
  await creator.getByLabel("Details").fill("The brand said the kulfi kit shipped last week but nothing has arrived yet.");
  await creator.getByRole("button", { name: "Send to BrandDeal" }).click();
  await expect(creator.getByText("Paused: BrandDeal is looking into an issue")).toBeVisible();
  await expect(creator.getByRole("button", { name: "Report a problem to BrandDeal" })).toBeHidden();

  const brand = await (await browser.newContext()).newPage();
  await signInWithPassword(brand, brandEmail);
  await expect(brand).toHaveURL(/\/brand$/);
  await brand.goto(`/deals/${dealId}`);
  await expect(brand.getByText("Kavya Creates reported: Product not received.", { exact: false })).toBeVisible();

  const admin = await (await browser.newContext({ storageState: ADMIN_STATE })).newPage();
  await admin.goto("/admin/disputes");
  const card = admin.locator("div").filter({ has: admin.getByText(title, { exact: true }) }).filter({ has: admin.getByRole("button", { name: "Resolve dispute" }) }).last();
  await expect(card).toContainText("Product not received");
  await card.getByLabel("Decision").selectOption("RESUME");
  await card.getByLabel("Note to both parties").fill("Courier confirmed delivery tomorrow; carry on.");
  await card.getByRole("button", { name: "Resolve dispute" }).click();
  await expect(admin.getByText(title, { exact: true })).toBeHidden();

  await creator.reload();
  await expect(creator.getByText("Issue resolved by BrandDeal").first()).toBeVisible();
  await expect(creator.getByText("Courier confirmed delivery tomorrow; carry on.", { exact: false })).toBeVisible();
  await expect(creator.getByRole("button", { name: "Report a problem to BrandDeal" })).toBeVisible();
});
