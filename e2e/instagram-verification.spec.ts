import { expect, test } from "@playwright/test";

import { ADMIN_STATE, adminSession, createCreatorReadyToVerify } from "./api-fixtures";
import { signInWithPassword } from "./helpers";

/**
 * Admin switch for Connect Instagram (D-36). The flag is global and specs run in parallel (switching it on makes
 * screenshot submissions in other specs fail), so it is only switched on when the API has Instagram app credentials
 * AND the run opts in with E2E_TOGGLE_FLAGS=1 (run this file alone), and always switched off again. The real
 * Instagram round-trip can't run here.
 */
test("admin settings show the Instagram verification switch and creators follow it", async ({ browser }) => {
  test.setTimeout(120_000);
  const admin = await (await browser.newContext({ storageState: ADMIN_STATE })).newPage();
  await admin.goto("/admin/settings");
  await expect(admin.getByRole("heading", { name: "Verify creators with Instagram" })).toBeVisible();
  const toggle = admin.getByRole("switch", { name: "Verify creators with Instagram" });
  await expect(toggle).toHaveAttribute("aria-checked", "false");

  const { email, creator: creatorApi } = await createCreatorReadyToVerify("Insta Riya");
  await creatorApi.dispose();
  const creator = await (await browser.newContext()).newPage();
  await signInWithPassword(creator, email);
  await expect(creator).toHaveURL(/\/creator$/);
  await creator.goto("/creator/verification");
  await expect(creator.getByRole("heading", { name: "Submit for verification" })).toBeVisible();

  const api = await adminSession();
  const flags = await (await api.get("admin/feature-flags")).json();
  const available = flags.items.find((f: { key: string }) => f.key === "INSTAGRAM_VERIFICATION")?.available;
  if (!available) {
    await expect(admin.getByText("Not set up yet.")).toBeVisible();
    await expect(toggle).toBeDisabled();
  }
  if (!available || !process.env.E2E_TOGGLE_FLAGS) {
    await api.dispose();
    return;
  }

  try {
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-checked", "true");
    await creator.reload();
    await expect(creator.getByRole("heading", { name: "Verify with Instagram" })).toBeVisible();
    await expect(creator.getByRole("button", { name: "Connect Instagram" })).toBeVisible();
    await expect(creator.getByRole("heading", { name: "Submit for verification" })).toBeHidden();
  } finally {
    await api.put("admin/feature-flags/INSTAGRAM_VERIFICATION", { data: { enabled: false } });
    await api.dispose();
  }
  await admin.reload();
  await expect(toggle).toHaveAttribute("aria-checked", "false");
  await creator.reload();
  await expect(creator.getByRole("heading", { name: "Submit for verification" })).toBeVisible();
});

test("the Instagram redirect page explains a cancelled connection", async ({ browser }) => {
  const { email, creator: creatorApi } = await createCreatorReadyToVerify("Insta Cancel");
  await creatorApi.dispose();
  const page = await (await browser.newContext()).newPage();
  await signInWithPassword(page, email);
  await expect(page).toHaveURL(/\/creator$/);
  await page.goto("/creator/verification/instagram?error=access_denied&error_reason=user_denied");
  await expect(page.getByRole("heading", { name: "Instagram wasn't connected" })).toBeVisible();
  await expect(page.getByText("You cancelled on Instagram")).toBeVisible();
});
