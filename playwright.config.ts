import { resolve } from "node:path";
import { defineConfig, devices } from "@playwright/test";

const E2E_DB = resolve(process.cwd(), "prisma/e2e.db");
const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  timeout: 30_000,
  expect: { timeout: 8_000 },
  // one server + one shared E2E DB, reset per test → run serially
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    ...devices["Desktop Chrome"],
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run build && npm run start",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      DATABASE_URL: `file:${E2E_DB}`,
      AUTH_SECRET: "e2e-secret-at-least-32-chars-1234567890abcd",
      E2E: "1",
      PORT: String(PORT),
      NODE_ENV: "production",
    },
  },
});
