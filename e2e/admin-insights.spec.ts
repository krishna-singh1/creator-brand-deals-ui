import { expect, test } from "@playwright/test";

import { ADMIN_STATE } from "./api-fixtures";

test("admin sees creator and brand funnels and deal economics for a period", async ({ browser }) => {
  const admin = await (await browser.newContext({ storageState: ADMIN_STATE })).newPage();
  await admin.goto("/admin/insights");
  await expect(admin.getByRole("heading", { name: "Insights" })).toBeVisible();
  await expect(admin.getByRole("heading", { name: "Creators" })).toBeVisible();
  await expect(admin.getByRole("heading", { name: "Brands" })).toBeVisible();
  await expect(admin.getByText("Asked for verification")).toBeVisible();
  await expect(admin.getByText("Got an applicant")).toBeVisible();
  await expect(admin.getByText("Deals per active brand")).toBeVisible();
  await expect(admin.getByText("Barter share")).toBeVisible();

  const reload = admin.waitForResponse((r) => r.url().includes("/admin/insights?days=90") && r.ok());
  await admin.getByLabel("Period").selectOption("90");
  await reload;
  await expect(admin.getByLabel("Period")).toHaveValue("90");
});
