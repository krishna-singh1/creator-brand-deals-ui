import { expect, test } from "@playwright/test";

import { createApprovedDeal } from "./api-fixtures";
import { signInWithPassword } from "./helpers";

test("brand and creator message each other on a deal", async ({ browser }) => {
  test.setTimeout(120_000);
  const title = `Rose falooda ${Date.now().toString(36)}`;
  const { brandEmail, creatorEmail, dealId } = await createApprovedDeal(title);

  const brand = await (await browser.newContext()).newPage();
  await signInWithPassword(brand, brandEmail);
  await expect(brand).toHaveURL(/\/brand$/);
  await brand.goto(`/deals/${dealId}`);
  await expect(brand.getByText("No messages yet.")).toBeVisible();
  await brand.getByLabel("Message", { exact: true }).fill("Hi! Could the reel go live on Friday evening?");
  await brand.getByRole("button", { name: "Send" }).click();
  await expect(brand.getByLabel("Message thread").getByText("Hi! Could the reel go live on Friday evening?")).toBeVisible();

  const creator = await (await browser.newContext()).newPage();
  await signInWithPassword(creator, creatorEmail);
  await expect(creator).toHaveURL(/\/creator$/);
  await creator.getByRole("button", { name: /Notifications, \d+ unread/ }).click();
  await creator.getByRole("button", { name: /New message from Saffron & Co/ }).click();
  await expect(creator).toHaveURL(new RegExp(`/deals/${dealId}$`));
  await expect(creator.getByLabel("Message thread").getByText("Hi! Could the reel go live on Friday evening?")).toBeVisible();

  // Enter sends; the brand sees the reply without reloading (the thread polls).
  await creator.getByLabel("Message", { exact: true }).fill("Friday 7 pm works for me.");
  await creator.getByLabel("Message", { exact: true }).press("Enter");
  await expect(creator.getByLabel("Message thread").getByText("Friday 7 pm works for me.")).toBeVisible();
  await expect(brand.getByLabel("Message thread").getByText("Friday 7 pm works for me.")).toBeVisible({ timeout: 20_000 });
});
