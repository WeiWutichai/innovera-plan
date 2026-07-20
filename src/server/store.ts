// ─────────────────────────────────────────────────────────────────────────
// In-memory data store — stands in for a real database.
// It is the single source of truth behind the /api route handlers. To move to
// a real backend, reimplement these methods against your DB; the API contract
// (and the whole client) stays unchanged.
//
// Kept as a process-global singleton so mutations survive Next.js dev HMR.
// ─────────────────────────────────────────────────────────────────────────

import {
  SEED_PROJECTS,
  SEED_TAGS,
  SEED_TASKS,
  SEED_USERS,
  seedActivity,
} from "@/lib/seed";
import { STATUS_ORDER } from "@/lib/types";
import type {
  Activity,
  Bootstrap,
  Project,
  Role,
  Status,
  Tag,
  Task,
  TaskForm,
  User,
  UserStatus,
} from "@/lib/types";

/** The current signed-in user id (activity actor). */
const ACTOR = "u1";

export interface CreateTaskInput {
  title: string;
  projectId: string;
  due: string | null;
  status: Status;
  urgent: boolean;
  important: boolean;
  tags: string[];
}

export interface EditTaskInput {
  title: string;
  projectId: string;
  due: string | null;
  status: Status;
  urgent: boolean;
  important: boolean;
  tags: string[];
}

export interface InviteInput {
  name: string;
  email: string;
  role: Role;
}

class Store {
  projects: Project[];
  tasks: Task[];
  tags: Tag[];
  users: User[];
  activity: Activity[];
  private seq = 1000;

  constructor() {
    this.projects = clone(SEED_PROJECTS);
    this.tasks = clone(SEED_TASKS);
    this.tags = clone(SEED_TAGS);
    this.users = clone(SEED_USERS);
    this.activity = seedActivity(Date.now());
  }

  private nextId(prefix: string): string {
    this.seq += 1;
    return prefix + this.seq;
  }

  private log(type: Activity["type"], data: Partial<Activity> = {}): Activity {
    const entry: Activity = { actor: ACTOR, type, ts: Date.now(), ...data };
    this.activity = [entry, ...this.activity].slice(0, 60);
    return entry;
  }

  bootstrap(): Bootstrap {
    return {
      projects: this.projects,
      tasks: this.tasks,
      tags: this.tags,
      users: this.users,
      activity: this.activity,
    };
  }

  private task(id: string): Task | undefined {
    return this.tasks.find((t) => t.id === id);
  }

  // ── task mutations ─────────────────────────────────────────────────────────
  createTask(input: CreateTaskInput): { task: Task; activity: Activity } {
    const task: Task = {
      id: this.nextId("t"),
      p: input.projectId,
      title: input.title.trim(),
      status: input.status,
      imp: input.important,
      urg: input.urgent,
      due: input.due || null,
      est: 0,
      spent: 0,
      desc: "",
      subs: [],
      tags: input.tags.slice(),
      assignee: ACTOR,
    };
    this.tasks = [...this.tasks, task];
    const activity = this.log("add", { title: task.title });
    return { task, activity };
  }

  editTask(id: string, input: EditTaskInput): { task: Task; activity: Activity } | null {
    const t = this.task(id);
    if (!t) return null;
    const task: Task = {
      ...t,
      title: input.title.trim(),
      p: input.projectId,
      due: input.due || null,
      status: input.status,
      imp: input.important,
      urg: input.urgent,
      tags: input.tags.slice(),
    };
    this.tasks = this.tasks.map((x) => (x.id === id ? task : x));
    const activity = this.log("edit", { title: task.title });
    return { task, activity };
  }

  setStatus(id: string, status: Status): { task: Task; activity: Activity } | null {
    const t = this.task(id);
    if (!t) return null;
    const task = { ...t, status };
    this.tasks = this.tasks.map((x) => (x.id === id ? task : x));
    const activity = this.log("status", { title: task.title, status });
    return { task, activity };
  }

  // Kanban chevron next/prev: mutate status silently — the prototype's cycle()
  // logs no activity (only the drag-drop path, which calls setStatus, does).
  cycleStatus(id: string, dir: number): { task: Task } | null {
    const t = this.task(id);
    if (!t) return null;
    let i = STATUS_ORDER.indexOf(t.status) + dir;
    i = Math.max(0, Math.min(STATUS_ORDER.length - 1, i));
    const status = STATUS_ORDER[i];
    const task = { ...t, status };
    this.tasks = this.tasks.map((x) => (x.id === id ? task : x));
    return { task };
  }

  toggleSub(id: string, index: number): { task: Task } | null {
    const t = this.task(id);
    if (!t) return null;
    const task = { ...t, subs: t.subs.map((s, i) => (i === index ? { ...s, d: !s.d } : s)) };
    this.tasks = this.tasks.map((x) => (x.id === id ? task : x));
    return { task };
  }

  toggleTag(id: string, tagId: string): { task: Task } | null {
    const t = this.task(id);
    if (!t) return null;
    const has = (t.tags || []).includes(tagId);
    const task = { ...t, tags: has ? t.tags.filter((x) => x !== tagId) : [...(t.tags || []), tagId] };
    this.tasks = this.tasks.map((x) => (x.id === id ? task : x));
    return { task };
  }

  setAssignee(id: string, userId: string): { task: Task; activity: Activity } | null {
    const t = this.task(id);
    if (!t) return null;
    const u = this.users.find((x) => x.id === userId);
    const task = { ...t, assignee: userId };
    this.tasks = this.tasks.map((x) => (x.id === id ? task : x));
    const activity = this.log("assign", { title: task.title, name: u ? u.name : "" });
    return { task, activity };
  }

  logTime(id: string, minutes: number): { task: Task; activity: Activity } | null {
    const t = this.task(id);
    if (!t) return null;
    const task = { ...t, spent: Math.round((t.spent + minutes / 60) * 100) / 100 };
    this.tasks = this.tasks.map((x) => (x.id === id ? task : x));
    const amount = minutes >= 60 ? minutes / 60 + "h" : minutes + "m";
    const activity = this.log("time", { title: task.title, amount });
    return { task, activity };
  }

  deleteTask(id: string): { removedId: string; activity: Activity } | null {
    const t = this.task(id);
    if (!t) return null;
    this.tasks = this.tasks.filter((x) => x.id !== id);
    const activity = this.log("del", { title: t.title });
    return { removedId: id, activity };
  }

  // ── user mutations ─────────────────────────────────────────────────────────
  inviteUser(input: InviteInput): { user: User; activity: Activity } {
    const user: User = {
      id: this.nextId("u"),
      name: input.name.trim(),
      email: input.email.trim() || "—",
      role: input.role,
      status: "invited",
    };
    this.users = [...this.users, user];
    const activity = this.log("invite", { name: user.name });
    return { user, activity };
  }

  setRole(id: string, role: Role): { user: User; activity: Activity } | null {
    const u = this.users.find((x) => x.id === id);
    if (!u) return null;
    const user = { ...u, role };
    this.users = this.users.map((x) => (x.id === id ? user : x));
    const activity = this.log("role", { name: user.name, role });
    return { user, activity };
  }

  setUserStatus(id: string, status: UserStatus): { user: User } | null {
    const u = this.users.find((x) => x.id === id);
    if (!u) return null;
    const user = { ...u, status };
    this.users = this.users.map((x) => (x.id === id ? user : x));
    return { user };
  }

  resetPassword(id: string): { activity: Activity; user: User } | null {
    const u = this.users.find((x) => x.id === id);
    if (!u) return null;
    const activity = this.log("reset", { name: u.name });
    return { activity, user: u };
  }

  removeUser(id: string): { removedId: string; reassigned: Task[] } | null {
    const u = this.users.find((x) => x.id === id);
    if (!u || u.me) return null;
    this.users = this.users.filter((x) => x.id !== id);
    const reassigned: Task[] = [];
    this.tasks = this.tasks.map((t) => {
      if (t.assignee === id) {
        const nt = { ...t, assignee: ACTOR };
        reassigned.push(nt);
        return nt;
      }
      return t;
    });
    return { removedId: id, reassigned };
  }
}

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

// Persist across dev HMR reloads.
const globalForStore = globalThis as unknown as { __innoveraStore?: Store };

export function getStore(): Store {
  if (!globalForStore.__innoveraStore) {
    globalForStore.__innoveraStore = new Store();
  }
  return globalForStore.__innoveraStore;
}
