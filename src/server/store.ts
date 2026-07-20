// ─────────────────────────────────────────────────────────────────────────
// Data repository — Prisma-backed (SQLite in dev, Postgres in prod).
// The single source of truth behind the /api route handlers. Every method
// returns the exact same DTO shapes the client already expects, so swapping
// from the previous in-memory store to a real database changed nothing above
// this file (the API contract and the whole client are untouched).
// ─────────────────────────────────────────────────────────────────────────

import { prisma } from "./db";
import { STATUS_ORDER } from "@/lib/types";
import type {
  Activity,
  Bootstrap,
  CreateTaskInput,
  EditTaskInput,
  InviteInput,
  Project,
  Role,
  Status,
  Tag,
  Task,
  User,
  UserStatus,
} from "@/lib/types";

export type { CreateTaskInput, EditTaskInput, InviteInput } from "@/lib/types";

/** The current signed-in user id (activity actor). */
const ACTOR = "u1";

// Prisma row types (structural — avoids importing generated model types).
type ProjectRow = { id: string; name: string; dot: string; start: string; due: string; stack: string; arch: string; repo: string; notes: string };
type TaskRow = { id: string; p: string; title: string; status: string; imp: boolean; urg: boolean; due: string | null; est: number; spent: number; desc: string; subs: string; tags: string; assignee: string };
type UserRow = { id: string; name: string; email: string; role: string; status: string; me: boolean };
type TagRow = { id: string; label: string };
type ActivityRow = { actor: string; type: string; ts: number; title: string | null; status: string | null; amount: string | null; name: string | null; role: string | null };

// ── mappers: DB row → API DTO ────────────────────────────────────────────────
function toProject(r: ProjectRow): Project {
  return { id: r.id, name: r.name, dot: r.dot, start: r.start, due: r.due, stack: JSON.parse(r.stack), arch: r.arch, repo: r.repo, notes: r.notes };
}
function toTask(r: TaskRow): Task {
  return {
    id: r.id, p: r.p, title: r.title, status: r.status as Status, imp: r.imp, urg: r.urg,
    due: r.due, est: r.est, spent: r.spent, desc: r.desc,
    subs: JSON.parse(r.subs), tags: JSON.parse(r.tags), assignee: r.assignee,
  };
}
function toUser(r: UserRow): User {
  return { id: r.id, name: r.name, email: r.email, role: r.role as Role, status: r.status as UserStatus, ...(r.me ? { me: true } : {}) };
}
function toTag(r: TagRow): Tag {
  return { id: r.id, label: r.label };
}
function toActivity(r: ActivityRow): Activity {
  const a: Activity = { actor: r.actor, type: r.type as Activity["type"], ts: r.ts };
  if (r.title) a.title = r.title;
  if (r.status) a.status = r.status as Status;
  if (r.amount) a.amount = r.amount;
  if (r.name) a.name = r.name;
  if (r.role) a.role = r.role as Role;
  return a;
}

function newId(prefix: string): string {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

async function log(type: Activity["type"], data: Partial<Activity> = {}): Promise<Activity> {
  const row = await prisma.activity.create({
    data: {
      actor: ACTOR,
      type,
      ts: Date.now(),
      title: data.title ?? null,
      status: data.status ?? null,
      amount: data.amount ?? null,
      name: data.name ?? null,
      role: data.role ?? null,
    },
  });
  return toActivity(row);
}

async function nextOrd(model: "task" | "user"): Promise<number> {
  const agg =
    model === "task"
      ? await prisma.task.aggregate({ _max: { ord: true } })
      : await prisma.user.aggregate({ _max: { ord: true } });
  return (agg._max.ord ?? 0) + 1;
}

const repo = {
  async bootstrap(): Promise<Bootstrap> {
    const [projects, tasks, tags, users, activity] = await Promise.all([
      prisma.project.findMany({ orderBy: { ord: "asc" } }),
      prisma.task.findMany({ orderBy: { ord: "asc" } }),
      prisma.tag.findMany({ orderBy: { ord: "asc" } }),
      prisma.user.findMany({ orderBy: { ord: "asc" } }),
      prisma.activity.findMany({ orderBy: [{ ts: "desc" }, { id: "desc" }], take: 60 }),
    ]);
    return {
      projects: projects.map(toProject),
      tasks: tasks.map(toTask),
      tags: tags.map(toTag),
      users: users.map(toUser),
      activity: activity.map(toActivity),
    };
  },

  // ── task mutations ─────────────────────────────────────────────────────────
  async createTask(input: CreateTaskInput): Promise<{ task: Task; activity: Activity }> {
    const row = await prisma.task.create({
      data: {
        id: newId("t"),
        ord: await nextOrd("task"),
        p: input.projectId,
        title: input.title.trim(),
        status: input.status,
        imp: input.important,
        urg: input.urgent,
        due: input.due || null,
        est: 0,
        spent: 0,
        desc: "",
        subs: "[]",
        tags: JSON.stringify(input.tags),
        assignee: ACTOR,
      },
    });
    const activity = await log("add", { title: row.title });
    return { task: toTask(row), activity };
  },

  async editTask(id: string, input: EditTaskInput): Promise<{ task: Task; activity: Activity } | null> {
    if (!(await prisma.task.findUnique({ where: { id } }))) return null;
    const row = await prisma.task.update({
      where: { id },
      data: {
        title: input.title.trim(),
        p: input.projectId,
        due: input.due || null,
        status: input.status,
        imp: input.important,
        urg: input.urgent,
        tags: JSON.stringify(input.tags),
      },
    });
    const activity = await log("edit", { title: row.title });
    return { task: toTask(row), activity };
  },

  async setStatus(id: string, status: Status): Promise<{ task: Task; activity: Activity } | null> {
    if (!(await prisma.task.findUnique({ where: { id } }))) return null;
    const row = await prisma.task.update({ where: { id }, data: { status } });
    const activity = await log("status", { title: row.title, status });
    return { task: toTask(row), activity };
  },

  // Kanban chevron: mutate silently — the prototype's cycle() logs no activity.
  async cycleStatus(id: string, dir: number): Promise<{ task: Task } | null> {
    const t = await prisma.task.findUnique({ where: { id } });
    if (!t) return null;
    let i = STATUS_ORDER.indexOf(t.status as Status) + dir;
    i = Math.max(0, Math.min(STATUS_ORDER.length - 1, i));
    const row = await prisma.task.update({ where: { id }, data: { status: STATUS_ORDER[i] } });
    return { task: toTask(row) };
  },

  async toggleSub(id: string, index: number): Promise<{ task: Task } | null> {
    const t = await prisma.task.findUnique({ where: { id } });
    if (!t) return null;
    const subs = JSON.parse(t.subs) as { t: string; d: boolean }[];
    if (subs[index]) subs[index] = { ...subs[index], d: !subs[index].d };
    const row = await prisma.task.update({ where: { id }, data: { subs: JSON.stringify(subs) } });
    return { task: toTask(row) };
  },

  async toggleTag(id: string, tagId: string): Promise<{ task: Task } | null> {
    const t = await prisma.task.findUnique({ where: { id } });
    if (!t) return null;
    const tags = JSON.parse(t.tags) as string[];
    const next = tags.includes(tagId) ? tags.filter((x) => x !== tagId) : [...tags, tagId];
    const row = await prisma.task.update({ where: { id }, data: { tags: JSON.stringify(next) } });
    return { task: toTask(row) };
  },

  async setAssignee(id: string, userId: string): Promise<{ task: Task; activity: Activity } | null> {
    if (!(await prisma.task.findUnique({ where: { id } }))) return null;
    const u = await prisma.user.findUnique({ where: { id: userId } });
    const row = await prisma.task.update({ where: { id }, data: { assignee: userId } });
    const activity = await log("assign", { title: row.title, name: u ? u.name : "" });
    return { task: toTask(row), activity };
  },

  async logTime(id: string, minutes: number): Promise<{ task: Task; activity: Activity } | null> {
    const t = await prisma.task.findUnique({ where: { id } });
    if (!t) return null;
    const spent = Math.round((t.spent + minutes / 60) * 100) / 100;
    const row = await prisma.task.update({ where: { id }, data: { spent } });
    const amount = minutes >= 60 ? minutes / 60 + "h" : minutes + "m";
    const activity = await log("time", { title: row.title, amount });
    return { task: toTask(row), activity };
  },

  async deleteTask(id: string): Promise<{ removedId: string; activity: Activity } | null> {
    const t = await prisma.task.findUnique({ where: { id } });
    if (!t) return null;
    await prisma.task.delete({ where: { id } });
    const activity = await log("del", { title: t.title });
    return { removedId: id, activity };
  },

  // ── user mutations ─────────────────────────────────────────────────────────
  async inviteUser(input: InviteInput): Promise<{ user: User; activity: Activity }> {
    const row = await prisma.user.create({
      data: {
        id: newId("u"),
        ord: await nextOrd("user"),
        name: input.name.trim(),
        email: input.email.trim() || "—",
        role: input.role,
        status: "invited",
        me: false,
      },
    });
    const activity = await log("invite", { name: row.name });
    return { user: toUser(row), activity };
  },

  async setRole(id: string, role: Role): Promise<{ user: User; activity: Activity } | null> {
    if (!(await prisma.user.findUnique({ where: { id } }))) return null;
    const row = await prisma.user.update({ where: { id }, data: { role } });
    const activity = await log("role", { name: row.name, role });
    return { user: toUser(row), activity };
  },

  async setUserStatus(id: string, status: UserStatus): Promise<{ user: User } | null> {
    if (!(await prisma.user.findUnique({ where: { id } }))) return null;
    const row = await prisma.user.update({ where: { id }, data: { status } });
    return { user: toUser(row) };
  },

  async resetPassword(id: string): Promise<{ activity: Activity; user: User } | null> {
    const u = await prisma.user.findUnique({ where: { id } });
    if (!u) return null;
    const activity = await log("reset", { name: u.name });
    return { activity, user: toUser(u) };
  },

  async removeUser(id: string): Promise<{ removedId: string; reassigned: Task[] } | null> {
    const u = await prisma.user.findUnique({ where: { id } });
    if (!u || u.me) return null;
    const affected = await prisma.task.findMany({ where: { assignee: id } });
    await prisma.$transaction([
      prisma.task.updateMany({ where: { assignee: id }, data: { assignee: ACTOR } }),
      prisma.user.delete({ where: { id } }),
    ]);
    const reassigned = affected.map((r) => ({ ...toTask(r), assignee: ACTOR }));
    return { removedId: id, reassigned };
  },
};

export function getStore() {
  return repo;
}
