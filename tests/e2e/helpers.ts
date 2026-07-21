import { expect, type Page } from "@playwright/test";

/** Reset the E2E database to the seed state (E2E-gated endpoint). */
export async function resetDb(page: Page) {
  const res = await page.request.post("/api/test/reset");
  expect(res.ok()).toBeTruthy();
}

/** Sign in and wait for the dashboard. Defaults to the seeded admin. */
export async function login(page: Page, email = "thanakorn@acme.co", password = "password") {
  await page.goto("/");
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click();
  await expect(page.getByRole("heading", { name: "ภาพรวม", exact: true })).toBeVisible();
}
