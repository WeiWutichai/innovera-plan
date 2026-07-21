import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { seedDatabase } from "@/server/seed-db";

export const dynamic = "force-dynamic";

// E2E-only helper: reseed the database to a known state so browser tests are
// isolated. Gated behind E2E=1 — it returns 404 everywhere else (production
// never sets E2E), so it is not a live endpoint outside the test harness.
export async function POST() {
  if (process.env.E2E !== "1") {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  await seedDatabase(prisma);
  return NextResponse.json({ ok: true });
}
