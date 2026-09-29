import { expect, test } from "@playwright/test";

import { createPassword, latestOtp, openProfileMenu, signIn, signOut } from "./helpers";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";
test("creator signs up with email OTP, onboards, and lands on the creator home", { tag: "@smoke" }, async ({ page }) => {
  const email = `e2e-creator-${Date.now()}@example.com`;

  await signIn(page, email);

  await expect(page).toHaveURL(/\/onboarding$/);
  await expect(page.getByText("Step 1 of 3")).toBeVisible();
  await createPassword(page);
  await page.getByRole("button", { name: /I'm a creator/ }).click();

  await expect(page.getByRole("heading", { name: "A few agreements" })).toBeVisible();
  const accept = page.getByRole("button", { name: "Accept and continue" });
  await expect(accept).toBeDisabled();
  for (const box of await page.getByRole("checkbox").all()) await box.check();
  await accept.click();

  await expect(page).toHaveURL(/\/creator$/);
  await expect(page.getByRole("link", { name: "Complete your creator profile" })).toBeVisible();

  // Session survives a reload (httpOnly cookies set by the API on its own origin).
  await page.reload();
  await expect(page.getByRole("button", { name: `Open profile menu (signed in as ${email})` })).toBeVisible();

  // The profile panel: personal pages, Esc closes it and focus returns to the avatar.
  await openProfileMenu(page);
  const panel = page.getByRole("dialog");
  await expect(panel.getByText(email)).toBeVisible();
  await expect(panel.getByRole("link", { name: /Verification/ })).toContainText("Not verified yet");
  await expect(panel.getByRole("link", { name: /Finish your profile/ })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();
  await expect(page.getByRole("button", { name: /^Open profile menu/ })).toBeFocused();

  // Role guard: a creator can't open the brand area.
  await page.goto("/brand");
  await expect(page).toHaveURL(/\/creator$/);

  await signOut(page);
  await expect(page).toHaveURL(/\/login(\?|$)/);
  await expect(page.getByRole("heading", { name: "Sign in to BrandDeal" })).toBeVisible();
  await page.goto("/creator");
  await expect(page).toHaveURL(/\/login\?next=%2Fcreator$/);
});

test("wrong code shows remaining attempts", async ({ page }) => {
  const email = `e2e-wrong-${Date.now()}@example.com`;
  await page.goto("/login");
  await page.getByRole("button", { name: "Email me a code instead" }).click();
  await expect(page.getByRole("heading", { name: "Sign in with a code" })).toBeVisible();
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Continue with email" }).click();
  const real = await latestOtp(email);
  await page.getByLabel("Login code").fill(real === "000000" ? "111111" : "000000");
  await page.getByRole("button", { name: "Verify and continue" }).click();
  await expect(page.getByText("That code isn't right. 4 attempts left.")).toBeVisible();
});

test("expired access token is refreshed transparently", async ({ page, context }) => {
  const email = `e2e-refresh-${Date.now()}@example.com`;
  await signIn(page, email);
  await createPassword(page);
  await page.getByRole("button", { name: /I'm a brand/ }).click();
  await expect(page.getByRole("heading", { name: "A few agreements" })).toBeVisible();
  for (const box of await page.getByRole("checkbox").all()) await box.check();
  await page.getByRole("button", { name: "Accept and continue" }).click();
  await expect(page).toHaveURL(/\/brand$/);

  // Drop only the access token; the refresh cookie (path /api/v1/auth) remains.
  const apiHost = new URL(API_URL).hostname;
  const cookies = await context.cookies();
  await context.clearCookies({ name: "bd_at" });
  expect(cookies.some((c) => c.name === "bd_rt" && c.domain.includes(apiHost))).toBe(true);

  await page.reload();
  await expect(page.getByRole("link", { name: "Complete your brand profile" })).toBeVisible();
  expect((await context.cookies()).some((c) => c.name === "bd_at")).toBe(true);
});
