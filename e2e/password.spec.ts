import { expect, test } from "@playwright/test";

import { PRODUCT } from "@/lib/product";
import { latestOtp, openProfileMenu, signInWithPassword, signOut, signUp, TEST_PASSWORD } from "./helpers";

test("returning user signs in with email and password, no code", async ({ page }) => {
  const email = `e2e-pw-${Date.now()}@example.com`;
  await signUp(page, email, "creator");
  await signOut(page);

  await signInWithPassword(page, email, "not my password");
  await expect(page.getByText("That email and password don't match.")).toBeVisible();

  await signInWithPassword(page, email);
  await expect(page).toHaveURL(/\/creator$/);
});

test("new email with a weak password is stopped before any code is sent", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(`e2e-weak-${Date.now()}@example.com`);
  await page.getByLabel("Password", { exact: true }).fill("password123");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByText("too easy to guess")).toBeVisible();
  await expect(page.getByRole("heading", { name: `Sign in to ${PRODUCT.name}` })).toBeVisible();
});

test("forgot password: reset with an emailed code, then sign in with the new password", async ({ page }) => {
  const email = `e2e-reset-${Date.now()}@example.com`;
  await signUp(page, email, "brand");
  await signOut(page);

  await page.goto("/login");
  await page.getByRole("button", { name: "Forgot password?" }).click();
  await expect(page.getByRole("heading", { name: "Reset your password" })).toBeVisible();
  await page.getByLabel("Email").fill(email);
  const requestedAt = new Date();
  await page.getByRole("button", { name: "Send reset code" }).click();
  await expect(page.getByRole("heading", { name: "Choose a new password" })).toBeVisible();
  await page.getByLabel("Reset code").fill(await latestOtp(email, requestedAt));
  await page.getByLabel("New password").fill("a brand new phrase");
  await page.getByRole("button", { name: "Reset password and sign in" }).click();
  await expect(page).toHaveURL(/\/brand$/);

  await signOut(page);
  await signInWithPassword(page, email, TEST_PASSWORD);
  await expect(page.getByText("That email and password don't match.")).toBeVisible();
  await signInWithPassword(page, email, "a brand new phrase");
  await expect(page).toHaveURL(/\/brand$/);
});

test("change password from the account page", async ({ page }) => {
  const email = `e2e-change-${Date.now()}@example.com`;
  await signUp(page, email, "creator");
  await openProfileMenu(page);
  await page.getByRole("link", { name: "Account & security" }).click();
  await expect(page.getByRole("heading", { name: "Change password" })).toBeVisible();

  await page.getByLabel("Current password").fill("wrong current password");
  await page.getByLabel("New password", { exact: true }).fill("second phrase here");
  await page.getByLabel("Confirm new password").fill("second phrase here");
  await page.getByRole("button", { name: "Update password" }).click();
  await expect(page.getByText("Current password is incorrect")).toBeVisible();

  await page.getByLabel("Current password").fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Update password" }).click();
  await expect(page.getByText("Password saved.")).toBeVisible();

  await signOut(page);
  await signInWithPassword(page, email, "second phrase here");
  await expect(page).toHaveURL(/\/creator$/);
});
