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

export async function signIn(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  const requestedAt = new Date();
  await page.getByRole("button", { name: "Continue with email" }).click();
  await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();
  await page.getByLabel("Login code").fill(await latestOtp(email, requestedAt));
  await page.getByRole("button", { name: "Verify and continue" }).click();
}

/** Accepts every pending policy on the onboarding consent step. */
export async function acceptConsents(page: Page) {
  await expect(page.getByRole("heading", { name: "A few agreements" })).toBeVisible();
  for (const box of await page.getByRole("checkbox").all()) await box.check();
  await page.getByRole("button", { name: "Accept and continue" }).click();
}

export async function signUp(page: Page, email: string, role: "creator" | "brand") {
  await signIn(page, email);
  await expect(page).toHaveURL(/\/onboarding$/);
  await page.getByRole("button", { name: role === "creator" ? /I'm a creator/ : /I'm a brand/ }).click();
  await acceptConsents(page);
  await expect(page).toHaveURL(role === "creator" ? /\/creator$/ : /\/brand$/);
}
