import { expect, test } from "@playwright/test";
import { login, resetDb } from "./helpers";

// Narrow viewport → the mobile shell (breakpoint 900px).
test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

test.beforeEach(async ({ page }) => {
  await resetDb(page);
});

test("mobile shell: bottom nav + More sheet", async ({ page }) => {
  await login(page); // the login helper works on the mobile login too

  // switch via the bottom tab bar
  await page.getByRole("button", { name: "บอร์ด", exact: true }).click();
  await expect(page.getByRole("heading", { name: "บอร์ดงาน", exact: true })).toBeVisible();

  // the "More" sheet exposes the secondary tabs
  await page.getByRole("button", { name: "เพิ่มเติม", exact: true }).click();
  await page.getByRole("button", { name: "ทีม", exact: true }).click();
  await expect(page.getByRole("heading", { name: "ทีม / ผู้ใช้", exact: true })).toBeVisible();
});
