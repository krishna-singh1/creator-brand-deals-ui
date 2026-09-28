import { expect, test } from "@playwright/test";

import { apiSession, createApprovedDeal } from "./api-fixtures";
import { openProfileMenu, signInWithPassword } from "./helpers";

/** Takes an approved cash deal through content approval, payment and confirmation via the API. */
async function payDeal(brandEmail: string, creatorEmail: string, dealId: string, amountPaise: number) {
  const brand = await apiSession(brandEmail);
  const creator = await apiSession(creatorEmail);
  const deal = await (await creator.get(`deals/${dealId}`)).json();
  const submission = await creator.post(`deals/${dealId}/deliverables/${deal.deliverables[0].id}/submissions`, {
    data: { postUrl: "https://www.instagram.com/reel/kesar123/", disclosureConfirmed: true },
  });
  expect(submission.ok(), await submission.text()).toBe(true);
  expect((await brand.post(`submissions/${(await submission.json()).id}/approve`)).ok()).toBe(true);
  const paidOn = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const paid = await brand.post(`deals/${dealId}/payment`, { data: { amountPaise, mode: "UPI", paidOn } });
  expect(paid.ok(), await paid.text()).toBe(true);
  expect((await creator.post(`deals/${dealId}/payment/confirm`)).ok()).toBe(true);
  await Promise.all([brand.dispose(), creator.dispose()]);
}

test("creator sees earnings and brand sees spend, by time frame, with a CSV download", async ({ browser }) => {
  test.setTimeout(120_000);
  const title = `Kesar kulfi ${Date.now().toString(36)}`;
  const { brandEmail, creatorEmail, dealId } = await createApprovedDeal(title);
  await payDeal(brandEmail, creatorEmail, dealId, 450000);

  const creator = await (await browser.newContext()).newPage();
  await signInWithPassword(creator, creatorEmail);
  await expect(creator).toHaveURL(/\/creator$/);
  await openProfileMenu(creator);
  await expect(creator.getByRole("link", { name: /Earnings/ })).toContainText("₹4,500 this month");
  await creator.getByRole("link", { name: /Earnings/ }).click();
  await expect(creator.getByRole("dialog")).toBeHidden();
  await expect(creator.getByRole("heading", { name: "What you've earned" })).toBeVisible();
  await expect(creator.getByRole("main").getByText("₹4,500").first()).toBeVisible();
  await expect(creator.getByRole("row").filter({ hasText: title })).toContainText("Confirmed");

  // A custom range with no payments.
  await creator.getByRole("radio", { name: "Custom" }).click();
  await creator.getByLabel("From", { exact: true }).fill("2024-01-01");
  await creator.getByLabel("To", { exact: true }).fill("2024-12-31");
  await expect(creator.getByText("No payments in this period.")).toBeVisible();
  await creator.getByRole("radio", { name: "This month" }).click();
  await expect(creator.getByRole("row").filter({ hasText: title })).toBeVisible();

  const brand = await (await browser.newContext()).newPage();
  await signInWithPassword(brand, brandEmail);
  await expect(brand).toHaveURL(/\/brand$/);
  await openProfileMenu(brand);
  await brand.getByRole("link", { name: /Spend/ }).click();
  await expect(brand.getByRole("heading", { name: "What you've spent" })).toBeVisible();
  await expect(brand.getByRole("row").filter({ hasText: title })).toContainText("Kavya Creates");
  const download = brand.waitForEvent("download");
  await brand.getByRole("button", { name: "Download CSV" }).click();
  expect((await download).suggestedFilename()).toMatch(/^branddeal-spend-\d{4}-\d{2}-\d{2}-to-\d{4}-\d{2}-\d{2}\.csv$/);
});
