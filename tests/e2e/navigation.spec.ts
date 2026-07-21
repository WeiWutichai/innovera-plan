import { expect, test } from "@playwright/test";
import { login, resetDb } from "./helpers";

test.beforeEach(async ({ page }) => {
  await resetDb(page);
});

test("navigates between views via the sidebar", async ({ page }) => {
  await login(page);

  await page.getByRole("button", { name: "บอร์ด" }).click();
  await expect(page.getByRole("heading", { name: "บอร์ด", exact: true })).toBeVisible();

  await page.getByRole("button", { name: "จัดลำดับ" }).click();
  await expect(page.getByRole("heading", { name: "จัดลำดับ", exact: true })).toBeVisible();

  await page.getByRole("button", { name: "ทีม / ผู้ใช้" }).click();
  await expect(page.getByRole("heading", { name: "ทีม / ผู้ใช้", exact: true })).toBeVisible();
  // team view lists the seeded members
  await expect(page.getByText("thanakorn@acme.co")).toBeVisible();
});

test("switches language TH → EN", async ({ page }) => {
  await login(page);
  await page.getByRole("button", { name: "EN", exact: true }).first().click();
  await expect(page.getByRole("heading", { name: "Overview", exact: true })).toBeVisible();
});
