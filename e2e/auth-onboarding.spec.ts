import { expect, test, type Page } from "@playwright/test";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";
const MAILPIT_URL = process.env.MAILPIT_URL ?? "http://localhost:8025";

/** Reads the newest login code sent to `email` from Mailpit (local SMTP catcher). */
async function latestOtp(email: string): Promise<string> {
  for (let i = 0; i < 30; i++) {
    const res = await fetch(`${MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`);
    const body = (await res.json()) as { messages: { Subject: string }[] };
    const match = body.messages.map((m) => /^(\d{6}) is your BrandDeal login code/.exec(m.Subject)).find(Boolean);
    if (match) return match[1];
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`No OTP email for ${email}`);
}

async function signIn(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Continue with email" }).click();
  await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();
  await page.getByLabel("Login code").fill(await latestOtp(email));
  await page.getByRole("button", { name: "Verify and continue" }).click();
}

test("creator signs up with email OTP, onboards, and lands on the creator home", async ({ page }) => {
  const email = `e2e-creator-${Date.now()}@example.com`;

  await signIn(page, email);

  await expect(page).toHaveURL(/\/onboarding$/);
  await page.getByRole("button", { name: /I'm a creator/ }).click();

  await expect(page.getByRole("heading", { name: "A few agreements" })).toBeVisible();
  const accept = page.getByRole("button", { name: "Accept and continue" });
  await expect(accept).toBeDisabled();
  for (const box of await page.getByRole("checkbox").all()) await box.check();
  await accept.click();

  await expect(page).toHaveURL(/\/creator$/);
  await expect(page.getByText("Next: complete your creator profile")).toBeVisible();

  // Session survives a reload (httpOnly cookies set by the API on its own origin).
  await page.reload();
  await expect(page.getByText(email)).toBeVisible();

  // Role guard: a creator can't open the brand area.
  await page.goto("/brand");
  await expect(page).toHaveURL(/\/creator$/);

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login(\?|$)/);
  await expect(page.getByRole("heading", { name: "Sign in to BrandDeal" })).toBeVisible();
  await page.goto("/creator");
  await expect(page).toHaveURL(/\/login\?next=%2Fcreator$/);
});

test("wrong code shows remaining attempts", async ({ page }) => {
  const email = `e2e-wrong-${Date.now()}@example.com`;
  await page.goto("/login");
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
  await expect(page.getByText("Next: set up your brand profile")).toBeVisible();
  expect((await context.cookies()).some((c) => c.name === "bd_at")).toBe(true);
});
