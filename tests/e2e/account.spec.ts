import { expect, test } from "@playwright/test";
import { login, resetDb } from "./helpers";

test.beforeEach(async ({ page }) => {
  await resetDb(page);
});

test("changes own password and stays signed in", async ({ page }) => {
  await login(page);
  await page.getByRole("button", { name: "เปลี่ยนรหัสผ่าน" }).click();
  const dialog = page.locator(".dialog");
  await expect(dialog.getByText("รหัสผ่านปัจจุบัน")).toBeVisible(); // unique field label
  const pw = dialog.locator('input[type="password"]');
  await pw.nth(0).fill("password");
  await pw.nth(1).fill("newpass123");
  await pw.nth(2).fill("newpass123");
  await dialog.getByRole("button", { name: "เปลี่ยนรหัสผ่าน", exact: true }).click();
  // dialog closes, still on the dashboard (current session kept alive)
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("heading", { name: "ภาพรวม", exact: true })).toBeVisible();
});

test("shows a mismatch error and does not submit", async ({ page }) => {
  await login(page);
  await page.getByRole("button", { name: "เปลี่ยนรหัสผ่าน" }).click();
  const dialog = page.locator(".dialog");
  const pw = dialog.locator('input[type="password"]');
  await pw.nth(0).fill("password");
  await pw.nth(1).fill("newpass123");
  await pw.nth(2).fill("different99");
  await dialog.getByRole("button", { name: "เปลี่ยนรหัสผ่าน", exact: true }).click();
  await expect(dialog.getByText("รหัสผ่านใหม่ไม่ตรงกัน")).toBeVisible();
});

test("invite → accept signs the new user in", async ({ page, context }) => {
  await login(page); // admin

  await page.getByRole("button", { name: "ทีม / ผู้ใช้" }).click();
  await page.getByRole("button", { name: "เชิญผู้ใช้" }).click();
  const inviteDialog = page.locator(".dialog");
  await inviteDialog.locator("input.input").first().fill("E2E Invitee");
  await inviteDialog.locator('input[type="email"]').fill("e2einvite@acme.co");
  await inviteDialog.getByRole("button", { name: "ส่งคำเชิญ" }).click();

  // the invite-link dialog exposes the accept URL
  const linkInput = page.locator("input[readonly]");
  await expect(linkInput).toBeVisible();
  const link = await linkInput.inputValue();
  expect(link).toContain("/accept-invite?token=");

  // open it as the invitee (fresh context, not signed in as admin)
  const inviteeCtx = await context.browser()!.newContext();
  const invitee = await inviteeCtx.newPage();
  await invitee.goto(link);
  await expect(invitee.getByRole("heading", { name: "ตั้งรหัสผ่าน" })).toBeVisible();
  await expect(invitee.getByText("e2einvite@acme.co")).toBeVisible();
  const pw = invitee.locator('input[type="password"]');
  await pw.nth(0).fill("inviteepw1");
  await pw.nth(1).fill("inviteepw1");
  await invitee.getByRole("button", { name: "ตั้งรหัสผ่านและเข้าใช้งาน" }).click();
  // activated + signed in → lands on the dashboard
  await expect(invitee.getByRole("heading", { name: "ภาพรวม", exact: true })).toBeVisible();
  await inviteeCtx.close();
});
