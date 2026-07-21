import { expect, test } from "@playwright/test";
import { login, resetDb } from "./helpers";

test.beforeEach(async ({ page }) => {
  await resetDb(page);
});

test("rejects wrong credentials with an error", async ({ page }) => {
  await page.goto("/");
  await page.locator('input[type="email"]').fill("thanakorn@acme.co");
  await page.locator('input[type="password"]').fill("wrongpass");
  await page.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click();
  await expect(page.getByText("อีเมลหรือรหัสผ่านไม่ถูกต้อง")).toBeVisible();
  // still on the login screen
  await expect(page.locator('input[type="email"]')).toBeVisible();
});

test("logs in and back out", async ({ page }) => {
  await login(page);
  await page.getByRole("button", { name: "ออกจากระบบ" }).click();
  // the login screen overlay returns (email field + sign-in button)
  await expect(page.locator('input[type="email"]')).toBeVisible();
  await expect(page.getByRole("button", { name: "เข้าสู่ระบบ", exact: true })).toBeVisible();
});
