import { expect, test } from "@playwright/test";

import { createApprovedDeal } from "./api-fixtures";
import { signInWithPassword } from "./helpers";

// 1×1 PNG.
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");

test("the creator attaches screenshots to a submission and the brand sees them", async ({ browser }) => {
  test.setTimeout(120_000);
  const { brandEmail, creatorEmail, dealId } = await createApprovedDeal(`Rose sherbet ${Date.now().toString(36)}`);

  const creator = await (await browser.newContext()).newPage();
  await signInWithPassword(creator, creatorEmail);
  await expect(creator).toHaveURL(/\/creator$/);
  await creator.goto(`/deals/${dealId}`);
  await creator.getByLabel(/Live post link for/).fill("https://www.instagram.com/reel/rosesherbet/");
  await creator.getByLabel(/Screenshots \(optional/).setInputFiles([
    { name: "reach.png", mimeType: "image/png", buffer: PNG },
    { name: "audience.png", mimeType: "image/png", buffer: PNG },
  ]);
  await creator.getByLabel(/The post clearly discloses/).check();
  await creator.getByRole("button", { name: "Submit for review" }).click();
  await expect(creator.getByRole("img", { name: "Screenshot 2 of 2" })).toBeVisible();

  const brand = await (await browser.newContext()).newPage();
  await signInWithPassword(brand, brandEmail);
  await expect(brand).toHaveURL(/\/brand$/);
  await brand.goto(`/deals/${dealId}`);
  const first = brand.getByRole("img", { name: "Screenshot 1 of 2" });
  await expect(first).toBeVisible();
  await expect.poll(() => first.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth)).toBeGreaterThan(0);
  await expect(brand.getByRole("button", { name: "Approve" })).toBeVisible();
});
