// Seed the database from the canonical seed data in src/lib/seed.ts.
// Run with: npm run db:seed  (or npm run db:reset to wipe + reseed)

import { PrismaClient } from "@prisma/client";
import {
  SEED_PROJECTS,
  SEED_TAGS,
  SEED_TASKS,
  SEED_USERS,
  seedActivity,
} from "../src/lib/seed";

const prisma = new PrismaClient();

async function main() {
  // wipe (FK-safe order: tasks reference projects + users)
  await prisma.activity.deleteMany();
  await prisma.task.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.user.deleteMany();
  await prisma.project.deleteMany();

  for (const [i, p] of SEED_PROJECTS.entries()) {
    await prisma.project.create({
      data: { id: p.id, ord: i, name: p.name, dot: p.dot, start: p.start, due: p.due, stack: JSON.stringify(p.stack), arch: p.arch, repo: p.repo, notes: p.notes },
    });
  }

  for (const [i, u] of SEED_USERS.entries()) {
    await prisma.user.create({
      data: { id: u.id, ord: i, name: u.name, email: u.email, role: u.role, status: u.status, me: !!u.me },
    });
  }

  for (const [i, t] of SEED_TAGS.entries()) {
    await prisma.tag.create({ data: { id: t.id, ord: i, label: t.label } });
  }

  for (const [i, t] of SEED_TASKS.entries()) {
    await prisma.task.create({
      data: {
        id: t.id, ord: i, p: t.p, title: t.title, status: t.status, imp: t.imp, urg: t.urg,
        due: t.due, est: t.est, spent: t.spent, desc: t.desc,
        subs: JSON.stringify(t.subs), tags: JSON.stringify(t.tags), assignee: t.assignee,
      },
    });
  }

  for (const a of seedActivity(Date.now())) {
    await prisma.activity.create({
      data: { actor: a.actor, type: a.type, ts: a.ts, title: a.title ?? null, status: a.status ?? null, amount: a.amount ?? null, name: a.name ?? null, role: a.role ?? null },
    });
  }

  const counts = {
    projects: await prisma.project.count(),
    users: await prisma.user.count(),
    tags: await prisma.tag.count(),
    tasks: await prisma.task.count(),
    activity: await prisma.activity.count(),
  };
  console.log("seeded:", counts);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
