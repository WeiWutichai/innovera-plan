// Production reset: WIPE all data, then create a single admin (from env vars)
// plus the default tags. No demo projects / tasks / users.
//
//   docker compose -f docker-compose.prod.yml run --build --rm \
//     -e ADMIN_NAME="Your Name" \
//     -e ADMIN_EMAIL="you@example.com" \
//     -e ADMIN_PASSWORD="a-strong-password" \
//     migrate npx tsx prisma/seed-prod.ts
//
// The password is supplied at runtime and never stored in the repo.

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { SEED_TAGS } from "../src/lib/seed";

const prisma = new PrismaClient();

const name = (process.env.ADMIN_NAME || "Admin").trim();
const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD || "";

async function main() {
  if (!email || !email.includes("@")) throw new Error("ADMIN_EMAIL is required (a valid email)");
  if (password.length < 8) throw new Error("ADMIN_PASSWORD is required (>= 8 characters)");

  // wipe everything (FK-safe order)
  await prisma.activity.deleteMany();
  await prisma.task.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.user.deleteMany();
  await prisma.project.deleteMany();

  // default tags (reference data used by the tag filter / chips)
  for (const [i, t] of SEED_TAGS.entries()) {
    await prisma.tag.create({ data: { id: t.id, ord: i, label: t.label } });
  }

  // the single admin
  await prisma.user.create({
    data: {
      id: "u1",
      ord: 0,
      name,
      email,
      password: await bcrypt.hash(password, 10),
      role: "admin",
      status: "active",
      me: false,
    },
  });

  console.log(`production seed done — admin: ${email}, tags: ${SEED_TAGS.length}, no demo data`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(String(e instanceof Error ? e.message : e));
    await prisma.$disconnect();
    process.exit(1);
  });
