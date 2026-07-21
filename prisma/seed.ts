// Seed the database from the canonical seed data.
// Run with: npm run db:seed  (or npm run db:reset to wipe + reseed)

import { PrismaClient } from "@prisma/client";
import { seedDatabase } from "../src/server/seed-db";

const prisma = new PrismaClient();

seedDatabase(prisma)
  .then((counts) => {
    console.log("seeded:", counts);
    return prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
