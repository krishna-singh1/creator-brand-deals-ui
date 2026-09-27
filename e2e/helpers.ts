import { expect, type Page } from "@playwright/test";

const MAILPIT_URL = process.env.MAILPIT_URL ?? "http://localhost:8025";

/** 1×1 PNG, enough for upload flows. */
export const PNG = {
  name: "insights.png",
  mimeType: "image/png",
  buffer: Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
  ),
};

/**
 * Reads the login code sent to `email` from Mailpit (local SMTP catcher). Only emails created after `since` count,
 * so a previous (already used) code is never picked while the outbox is still sending the new one.
 */
export async function latestOtp(email: string, since = new Date(0)): Promise<string> {
  for (let i = 0; i < 40; i++) {
    const res = await fetch(`${MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`);
    const body = (await res.json()) as { messages: { Subject: string; Created: string }[] };
    const match = body.messages
      .filter((m) => new Date(m.Created).getTime() >= since.getTime() - 1000)
      .map((m) => /^(\d{6}) is your BrandDeal login code/.exec(m.Subject))
      .find(Boolean);
    if (match) return match[1];
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`No OTP email for ${email}`);
}

export const TEST_PASSWORD = "monsoon chai at six";

/** Signs in with an emailed code (new accounts, or "Email me a code instead"). */
export async function signIn(page: Page, email: string) {
  await page.goto("/login");
  await page.getByRole("button", { name: "Email me a code instead" }).click();
  await page.getByLabel("Email").fill(email);
  const requestedAt = new Date();
  await page.getByRole("button", { name: "Continue with email" }).click();
  await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();
  await page.getByLabel("Login code").fill(await latestOtp(email, requestedAt));
  await page.getByRole("button", { name: "Verify and continue" }).click();
}

/** Signs out and waits until the session is gone (navigating away earlier would cancel the logout request). */
export async function signOut(page: Page) {
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login/);
}

export async function signInWithPassword(page: Page, email: string, password = TEST_PASSWORD) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
}

/** Onboarding step 1 for code-only accounts. */
export async function createPassword(page: Page, password = TEST_PASSWORD) {
  await expect(page.getByRole("heading", { name: "Create your password" })).toBeVisible();
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page.getByRole("button", { name: "Save password and continue" }).click();
}

/** Accepts every pending policy on the onboarding consent step. */
export async function acceptConsents(page: Page) {
  await expect(page.getByRole("heading", { name: "A few agreements" })).toBeVisible();
  for (const box of await page.getByRole("checkbox").all()) await box.check();
  await page.getByRole("button", { name: "Accept and continue" }).click();
}

/** New account: email + password → verify email with the code → role → agreements → role home. */
export async function signUp(page: Page, email: string, role: "creator" | "brand", password = TEST_PASSWORD) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  const requestedAt = new Date();
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Verify your email" })).toBeVisible();
  await page.getByLabel("Verification code").fill(await latestOtp(email, requestedAt));
  await page.getByRole("button", { name: "Verify and sign in" }).click();
  await expect(page).toHaveURL(/\/onboarding$/);
  await expect(page.getByText("Step 1 of 2")).toBeVisible();
  await page.getByRole("button", { name: role === "creator" ? /I'm a creator/ : /I'm a brand/ }).click();
  await acceptConsents(page);
  await expect(page).toHaveURL(role === "creator" ? /\/creator$/ : /\/brand$/);
}

/** Completes whatever onboarding steps an existing account still has (password and/or agreements). */
export async function finishOnboarding(page: Page) {
  const consents = page.getByRole("heading", { name: "A few agreements" });
  const password = page.getByRole("heading", { name: "Create your password" });
  const settled = async () => !page.url().endsWith("/onboarding") || (await consents.isVisible());

  await page.waitForURL(/\/(onboarding|admin|creator|brand)$/);
  if (!page.url().endsWith("/onboarding")) return;
  await expect(password.or(consents)).toBeVisible();
  if (await password.isVisible()) await createPassword(page);
  await expect(async () => expect(await settled()).toBe(true)).toPass();
  if (await consents.isVisible()) await acceptConsents(page);
}
