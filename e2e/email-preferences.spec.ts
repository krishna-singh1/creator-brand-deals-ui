import { expect, test } from "@playwright/test";

import { openProfileMenu, signUp } from "./helpers";

test("turn email notifications off and back on from the account page", async ({ page }) => {
  await signUp(page, `e2e-emails-${Date.now()}@example.com`, "brand");
  await openProfileMenu(page);
  await page.getByRole("link", { name: "Account & security" }).click();
  await expect(page.getByRole("heading", { name: "Email notifications" })).toBeVisible();

  const toggle = page.getByRole("switch", { name: "Email notifications" });
  await expect(toggle).toHaveAttribute("aria-checked", "true");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-checked", "false");
  await expect(page.getByText("Emails are off")).toBeVisible();

  await page.reload();
  await expect(toggle).toHaveAttribute("aria-checked", "false");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-checked", "true");
  await expect(page.getByText("Emails are on")).toBeVisible();
});
