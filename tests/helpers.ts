import { prisma } from "@/server/db";
import { seedDatabase } from "@/server/seed-db";

export { prisma };

/** Reset the test DB to the canonical seed dataset. Call in beforeEach. */
export async function resetDb() {
  await seedDatabase(prisma);
}
