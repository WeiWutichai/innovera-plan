import { resolve } from "node:path";
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

// Absolute path so Prisma resolves the SQLite file the same way regardless of cwd.
const TEST_DB = resolve(process.cwd(), "prisma/test.db");

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globalSetup: ["./tests/global-setup.ts"],
    // integration tests share one DB — don't run test files in parallel
    fileParallelism: false,
    env: {
      DATABASE_URL: `file:${TEST_DB}`,
      AUTH_SECRET: "test-secret-at-least-32-chars-1234567890abcd",
    },
  },
});
