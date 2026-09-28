import { expect, test } from "@playwright/test";

import { apiSession, createBrandWithCampaign, createVerifiedCreator } from "./api-fixtures";
import { signInWithPassword } from "./helpers";

test("brand edits a live brief within the limits and the applicant is told", async ({ browser }) => {
  test.setTimeout(120_000);
  const title = `Filter coffee ${Date.now().toString(36)}`;
  const { brandEmail, campaignId } = await createBrandWithCampaign(title);
  const creatorEmail = await createVerifiedCreator("Kavya Creates");
  const creatorApi = await apiSession(creatorEmail);
  const applied = await creatorApi.post(`campaigns/${campaignId}/applications`, {
    data: {
      pitch: "Filter coffee mornings are my most-saved reels; my audience asks for brew guides every week. One slow reel.",
      quote: [{ deliverableType: "IG_REEL", quantity: 1, unitPricePaise: 500000 }],
      availabilityConfirmed: true,
    },
  });
  expect(applied.ok(), await applied.text()).toBe(true);
  await creatorApi.dispose();

  const brand = await (await browser.newContext()).newPage();
  await signInWithPassword(brand, brandEmail);
  await expect(brand).toHaveURL(/\/brand$/);
  await brand.goto(`/brand/campaigns/${campaignId}`);
  await brand.getByRole("link", { name: "Edit brief" }).click();
  await expect(brand.getByText("Edit live campaign")).toBeVisible();

  // Pay and audience are locked; wording and headcount aren't.
  await expect(brand.getByLabel("Followers from")).toBeDisabled();
  await expect(brand.getByLabel("Cash budget from (₹)")).toBeDisabled();
  await brand.getByLabel("Description").fill("Film our filter coffee kit on a slow Sunday morning. Natural light, no voice-over needed.");
  await brand.getByLabel("Creators needed").fill("5");
  await brand.getByRole("button", { name: "Save changes" }).click();
  await expect(brand).toHaveURL(new RegExp(`/brand/campaigns/${campaignId}$`));
  await expect(brand.getByText("Natural light, no voice-over needed.", { exact: false })).toBeVisible();

  const creator = await (await browser.newContext()).newPage();
  await signInWithPassword(creator, creatorEmail);
  await expect(creator).toHaveURL(/\/creator$/);
  await creator.getByRole("button", { name: /Notifications, \d+ unread/ }).click();
  await expect(creator.getByText(`Brief updated: ${title}`)).toBeVisible();
  await expect(creator.getByText("The brand updated the description, creators needed.", { exact: false })).toBeVisible();
});
