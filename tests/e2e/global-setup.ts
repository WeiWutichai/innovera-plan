import { execSync } from "node:child_process";
import { rmSync } from "node:fs";
import { resolve } from "node:path";

// Provision a fresh E2E database (schema pushed) before the web server starts.
// The per-test data reset happens via POST /api/test/reset (E2E-gated).
export default function globalSetup() {
  const dbFile = resolve(process.cwd(), "prisma/e2e.db");
  rmSync(dbFile, { force: true });
  rmSync(dbFile + "-journal", { force: true });
  execSync("npx prisma db push --skip-generate", {
    env: { ...process.env, DATABASE_URL: `file:${dbFile}` },
    stdio: "inherit",
  });
}
