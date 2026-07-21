import { execSync } from "node:child_process";
import { rmSync } from "node:fs";
import { resolve } from "node:path";

// Provision a fresh test database (schema pushed) once before the suite runs.
export default function setup() {
  const dbFile = resolve(process.cwd(), "prisma/test.db");
  rmSync(dbFile, { force: true });
  rmSync(dbFile + "-journal", { force: true });
  execSync("npx prisma db push --skip-generate", {
    env: { ...process.env, DATABASE_URL: `file:${dbFile}` },
    stdio: "inherit",
  });
}
