// Seed the database only if it is empty. Used by the production `migrate`
// service so redeploys never wipe live data (the plain seed does deleteMany).

import { PrismaClient } from "@prisma/client";
import { seedDatabase } from "../src/server/seed-db";

const prisma = new PrismaClient();

(async () => {
  try {
    const n = await prisma.user.count();
    if (n === 0) {
      const counts = await seedDatabase(prisma);
      console.log("seeded:", counts);
    } else {
      console.log(`db already has ${n} users — skipping seed`);
    }
  } finally {
    await prisma.$disconnect();
  }
})();
