// ─────────────────────────────────────────────────────────────────────────
// Data repository — Prisma-backed (SQLite in dev, Postgres in prod).
// The single source of truth behind the /api route handlers. Every method
// returns the exact same DTO shapes the client already expects.
//
// The activity `actor` and the "me" flag come from the authenticated user
// (passed in from the verified session by the route handlers) — never from the
// request body, so a client cannot spoof who it is.
// ─────────────────────────────────────────────────────────────────────────

import { createHash, randomBytes } from "crypto";
import { prisma } from "./db";
import { DUMMY_HASH, hashPassword, verifyPassword } from "./auth";
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

// Prisma row types (structural).
type ProjectRow = { id: string; name: string; dot: string; start: string; due: string; stack: string; arch: string; repo: string; notes: string };
type TaskRow = { id: string; p: string; title: string; status: string; imp: boolean; urg: boolean; due: string | null; est: number; spent: number; desc: string; subs: string; tags: string; assignee: string };
type UserRow = { id: string; name: string; email: string; password: string; role: string; status: string; me: boolean; sessionVersion: number };
type TagRow = { id: string; label: string };
type ActivityRow = { actor: string; type: string; ts: number; title: string | null; status: string | null; amount: string | null; name: string | null; role: string | null };

// ── mappers: DB row → API DTO (never leak the password hash) ─────────────────
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
/** `meId` (the current session user) decides the "me" flag when provided. */
function toUser(r: UserRow, meId?: string): User {
  const me = meId != null ? r.id === meId : !!r.me;
  return { id: r.id, name: r.name, email: r.email, role: r.role as Role, status: r.status as UserStatus, ...(me ? { me: true } : {}) };
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

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const hashToken = (raw: string) => createHash("sha256").update(raw).digest("hex");

async function log(actor: string, type: Activity["type"], data: Partial<Activity> = {}): Promise<Activity> {
  const row = await prisma.activity.create({
    data: {
      actor,
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
  // ── auth ────────────────────────────────────────────────────────────────────
  async verifyCredentials(email: string, password: string): Promise<{ user: User; sessionVersion: number } | null> {
    const row = await prisma.user.findUnique({ where: { email } });
    // Only active accounts can sign in (invited/disabled cannot). Always run a
    // bcrypt compare — against a dummy hash when there's no eligible user — so
    // the response time doesn't reveal whether the account exists.
    const active = !!row && row.status === "active";
    const ok = await verifyPassword(password, active ? row!.password : DUMMY_HASH);
    if (!active || !ok) return null;
    return { user: toUser(row!, row!.id), sessionVersion: row!.sessionVersion };
  },

  /**
   * Resolve the user a session token belongs to. Returns null when the account
   * is missing, disabled, or the token's version is stale (revoked) — so a
   * leaked/old token stops working immediately, not only after it expires.
   */
  async resolveSession(userId: string, sv: number): Promise<User | null> {
    const row = await prisma.user.findUnique({ where: { id: userId } });
    if (!row || row.status === "disabled" || row.sessionVersion !== sv) return null;
    return toUser(row, row.id);
  },

  /** Invalidate every already-issued session for a user. */
  async bumpSessionVersion(userId: string): Promise<void> {
    await prisma.user.updateMany({ where: { id: userId }, data: { sessionVersion: { increment: 1 } } });
  },

  /**
   * Change a user's own password. Verifies the current password, then updates it
   * and bumps sessionVersion (revoking OTHER sessions). Returns the new
   * sessionVersion so the caller can re-issue the current session's token and
   * keep it alive. Returns { ok:false } if the current password is wrong.
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ ok: boolean; sessionVersion?: number }> {
    const row = await prisma.user.findUnique({ where: { id: userId } });
    if (!row || !(await verifyPassword(currentPassword, row.password))) return { ok: false };
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { password: await hashPassword(newPassword), sessionVersion: { increment: 1 } },
    });
    return { ok: true, sessionVersion: updated.sessionVersion };
  },

  async bootstrap(currentUserId: string): Promise<Bootstrap> {
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
      users: users.map((u) => toUser(u, currentUserId)),
      activity: activity.map(toActivity),
    };
  },

  // ── task mutations (actor = authenticated user) ──────────────────────────────
  async createTask(input: CreateTaskInput, actor: string): Promise<{ task: Task; activity: Activity }> {
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
        assignee: actor,
      },
    });
    const activity = await log(actor, "add", { title: row.title });
    return { task: toTask(row), activity };
  },

  async editTask(id: string, input: EditTaskInput, actor: string): Promise<{ task: Task; activity: Activity } | null> {
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
    const activity = await log(actor, "edit", { title: row.title });
    return { task: toTask(row), activity };
  },

  async setStatus(id: string, status: Status, actor: string): Promise<{ task: Task; activity: Activity } | null> {
    if (!(await prisma.task.findUnique({ where: { id } }))) return null;
    const row = await prisma.task.update({ where: { id }, data: { status } });
    const activity = await log(actor, "status", { title: row.title, status });
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

  async setAssignee(id: string, userId: string, actor: string): Promise<{ task: Task; activity: Activity } | null> {
    if (!(await prisma.task.findUnique({ where: { id } }))) return null;
    const u = await prisma.user.findUnique({ where: { id: userId } });
    const row = await prisma.task.update({ where: { id }, data: { assignee: userId } });
    const activity = await log(actor, "assign", { title: row.title, name: u ? u.name : "" });
    return { task: toTask(row), activity };
  },

  async logTime(id: string, minutes: number, actor: string): Promise<{ task: Task; activity: Activity } | null> {
    const t = await prisma.task.findUnique({ where: { id } });
    if (!t) return null;
    const spent = Math.round((t.spent + minutes / 60) * 100) / 100;
    const row = await prisma.task.update({ where: { id }, data: { spent } });
    const amount = minutes >= 60 ? minutes / 60 + "h" : minutes + "m";
    const activity = await log(actor, "time", { title: row.title, amount });
    return { task: toTask(row), activity };
  },

  async deleteTask(id: string, actor: string): Promise<{ removedId: string; activity: Activity } | null> {
    const t = await prisma.task.findUnique({ where: { id } });
    if (!t) return null;
    await prisma.task.delete({ where: { id } });
    const activity = await log(actor, "del", { title: t.title });
    return { removedId: id, activity };
  },

  // ── user mutations ─────────────────────────────────────────────────────────
  async inviteUser(input: InviteInput, actor: string): Promise<{ user: User; activity: Activity; inviteToken: string }> {
    // Invited users get a random (unusable) password and status "invited"; they
    // activate by accepting the invite (setting their own password) via a
    // one-time token whose sha256 hash + expiry are stored here.
    const rawToken = randomBytes(32).toString("hex");
    const row = await prisma.user.create({
      data: {
        id: newId("u"),
        ord: await nextOrd("user"),
        name: input.name.trim(),
        email: (input.email.trim() || newId("invite") + "@acme.co").toLowerCase(),
        password: await hashPassword(newId("pw") + newId("pw")),
        role: input.role,
        status: "invited",
        me: false,
        inviteToken: hashToken(rawToken),
        inviteExpires: Date.now() + INVITE_TTL_MS,
      },
    });
    const activity = await log(actor, "invite", { name: row.name });
    return { user: toUser(row, actor), activity, inviteToken: rawToken };
  },

  /** Look up a pending invite by its raw token (for the accept page). */
  async getInvite(rawToken: string): Promise<{ name: string; email: string } | null> {
    const row = await prisma.user.findFirst({ where: { inviteToken: hashToken(rawToken), status: "invited" } });
    if (!row || !row.inviteExpires || row.inviteExpires < Date.now()) return null;
    return { name: row.name, email: row.email };
  },

  /** Accept an invite: set the password, activate the account, consume the token. */
  async acceptInvite(rawToken: string, password: string): Promise<{ user: User; sessionVersion: number } | null> {
    const row = await prisma.user.findFirst({ where: { inviteToken: hashToken(rawToken), status: "invited" } });
    if (!row || !row.inviteExpires || row.inviteExpires < Date.now()) return null;
    const updated = await prisma.user.update({
      where: { id: row.id },
      data: {
        password: await hashPassword(password),
        status: "active",
        inviteToken: null,
        inviteExpires: null,
        sessionVersion: { increment: 1 },
      },
    });
    return { user: toUser(updated, updated.id), sessionVersion: updated.sessionVersion };
  },

  async setRole(id: string, role: Role, actor: string): Promise<{ user: User; activity: Activity } | null> {
    if (!(await prisma.user.findUnique({ where: { id } }))) return null;
    const row = await prisma.user.update({ where: { id }, data: { role } });
    const activity = await log(actor, "role", { name: row.name, role });
    return { user: toUser(row, actor), activity };
  },

  async setUserStatus(id: string, status: UserStatus, actor: string): Promise<{ user: User } | null> {
    if (!(await prisma.user.findUnique({ where: { id } }))) return null;
    // Disabling also revokes the user's live sessions.
    const data = status === "disabled" ? { status, sessionVersion: { increment: 1 } } : { status };
    const row = await prisma.user.update({ where: { id }, data });
    return { user: toUser(row, actor) };
  },

  async resetPassword(id: string, actor: string): Promise<{ activity: Activity; user: User } | null> {
    const u = await prisma.user.findUnique({ where: { id } });
    if (!u) return null;
    // Invalidate the current credential (fresh random hash) AND revoke live
    // sessions. In a real deployment this pairs with a one-time reset link.
    await prisma.user.update({
      where: { id },
      data: { password: await hashPassword(newId("pw") + newId("pw")), sessionVersion: { increment: 1 } },
    });
    const activity = await log(actor, "reset", { name: u.name });
    return { activity, user: toUser(u, actor) };
  },

  async removeUser(id: string, actor: string): Promise<{ removedId: string; reassigned: Task[] } | null> {
    const u = await prisma.user.findUnique({ where: { id } });
    if (!u || u.id === actor) return null; // can't remove yourself
    const affected = await prisma.task.findMany({ where: { assignee: id } });
    await prisma.$transaction([
      prisma.task.updateMany({ where: { assignee: id }, data: { assignee: actor } }),
      prisma.user.delete({ where: { id } }),
    ]);
    const reassigned = affected.map((r) => ({ ...toTask(r), assignee: actor }));
    return { removedId: id, reassigned };
  },
};

export function getStore() {
  return repo;
}
