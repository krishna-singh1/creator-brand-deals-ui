import { expect, test } from "@playwright/test";

import { createApprovedDeal } from "./api-fixtures";
import { signInWithPassword } from "./helpers";

test("a cash deal runs from content to payment to ratings", async ({ browser }) => {
  test.setTimeout(180_000);
  const title = `Saffron evenings ${Date.now().toString(36)}`;
  const { brandEmail, creatorEmail, dealId } = await createApprovedDeal(title);

  const creator = await (await browser.newContext()).newPage();
  await signInWithPassword(creator, creatorEmail);
  await expect(creator).toHaveURL(/\/creator$/);
  await creator.getByRole("link", { name: "Deals", exact: true }).click();
  await creator.getByRole("link").filter({ hasText: title }).click();
  await expect(creator).toHaveURL(new RegExp(`/deals/${dealId}$`));
  await expect(creator.getByText("Time to create")).toBeVisible();
  await expect(creator.getByText("Nisha Rao")).toBeVisible();

  // Creator submits the live post.
  await creator.getByLabel(/Live post link/).fill("https://www.instagram.com/reel/saffron123/");
  await creator.getByLabel(/clearly discloses the collaboration/).check();
  await creator.getByRole("button", { name: "Submit for review" }).click();
  await expect(creator.getByText("Waiting for the brand")).toBeVisible();

  // Brand asks for a change, creator resubmits, brand approves.
  const brand = await (await browser.newContext()).newPage();
  await signInWithPassword(brand, brandEmail);
  await expect(brand).toHaveURL(/\/brand$/);
  await brand.goto(`/deals/${dealId}`);
  await expect(brand.getByText("Content to review")).toBeVisible();
  await expect(brand.getByText("Kavya Creates Test")).toBeVisible();
  await brand.getByRole("button", { name: "Request changes" }).click();
  await brand.getByLabel("What should change?").fill("Please show the kit's label in the first 3 seconds.");
  await brand.getByRole("button", { name: "Send to creator" }).click();
  await expect(brand.getByText("The creator is working on it")).toBeVisible();

  await creator.reload();
  await expect(creator.getByText("Brand's note: Please show the kit's label")).toBeVisible();
  await creator.getByLabel(/Live post link/).fill("https://www.instagram.com/reel/saffron124/");
  await creator.getByLabel(/clearly discloses the collaboration/).check();
  await creator.getByRole("button", { name: "Submit for review" }).click();
  await expect(creator.getByText("1 revision")).toBeVisible();

  await brand.reload();
  await brand.getByRole("button", { name: /^Approve/ }).click();
  await expect(brand.getByText("Pay the creator")).toBeVisible();

  // Payment: brand records, creator confirms.
  await expect(brand.getByLabel("Amount paid (₹)")).toHaveValue("5000");
  await brand.getByLabel("Reference (optional)").fill("UTR998877");
  await brand.getByRole("button", { name: "Record payment" }).click();
  await expect(brand.getByText("Waiting for the creator to confirm")).toBeVisible();

  await creator.reload();
  await expect(creator.getByText("Confirm your payment")).toBeVisible();
  await creator.getByRole("button", { name: "I received the payment" }).click();
  await expect(creator.getByText("Rate your partner")).toBeVisible();

  // Ratings.
  await creator.getByRole("radio", { name: "5 stars" }).click();
  await creator.getByPlaceholder("Optional: what stood out?").fill("Clear brief, paid on time.");
  await creator.getByRole("button", { name: "Submit rating" }).click();
  await expect(creator.getByText("Your rating")).toBeVisible();

  await brand.reload();
  await brand.getByRole("radio", { name: "4 stars" }).click();
  await brand.getByRole("button", { name: "Submit rating" }).click();
  await expect(brand.getByText("Kavya Creates's rating of you")).toBeVisible();
  await expect(brand.getByText("Deal completed").first()).toBeVisible();
});
