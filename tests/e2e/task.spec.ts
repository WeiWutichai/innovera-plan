import { expect, test } from "@playwright/test";
import { login, resetDb } from "./helpers";

test.beforeEach(async ({ page }) => {
  await resetDb(page);
});

test("opens a task drawer with its details", async ({ page }) => {
  await login(page);
  await page.getByText("แก้บั๊ก double-charge บน sandbox").first().click();
  await expect(page.getByRole("heading", { name: "แก้บั๊ก double-charge บน sandbox" })).toBeVisible();
  await expect(page.getByText("มอบหมายให้")).toBeVisible(); // assigned-to section
  await expect(page.getByText("ข้อมูลโปรเจกต์")).toBeVisible(); // project info card
});

test("creates a task via the add dialog", async ({ page }) => {
  await login(page);
  await page.getByRole("button", { name: "เพิ่มงาน" }).first().click();
  const dialog = page.locator(".dialog");
  await expect(dialog.getByText("เพิ่มงานใหม่")).toBeVisible();
  await dialog.locator("input.input").first().fill("E2E task example");
  await dialog.getByRole("button", { name: "เพิ่มงาน", exact: true }).click();
  // submitting a new task opens its drawer
  await expect(page.getByRole("heading", { name: "E2E task example" })).toBeVisible();
});
