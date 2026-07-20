// ─────────────────────────────────────────────────────────────────────────
// Typed client for the /api backend. Every server round-trip goes through here,
// so swapping the backend (or adding auth headers) is a one-file change.
// ─────────────────────────────────────────────────────────────────────────

import type {
  Activity,
  Bootstrap,
  CreateTaskInput,
  EditTaskInput,
  InviteInput,
  Role,
  Status,
  Task,
  User,
  UserStatus,
} from "./types";

async function req<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status} ${msg}`);
  }
  return res.json() as Promise<T>;
}

const patchTask = (id: string, body: Record<string, unknown>) =>
  req<{ task?: Task; activity?: Activity }>(`/api/tasks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });

const patchUser = (id: string, body: Record<string, unknown>) =>
  req<{ user?: User; activity?: Activity }>(`/api/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });

export const api = {
  bootstrap: () => req<Bootstrap>("/api/bootstrap", { cache: "no-store" }),

  // tasks
  createTask: (input: CreateTaskInput) =>
    req<{ task: Task; activity: Activity }>("/api/tasks", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  editTask: (id: string, input: EditTaskInput) =>
    patchTask(id, { action: "edit", input }) as Promise<{ task: Task; activity: Activity }>,
  setStatus: (id: string, status: Status) =>
    patchTask(id, { action: "setStatus", status }) as Promise<{ task: Task; activity: Activity }>,
  cycleStatus: (id: string, dir: number) =>
    patchTask(id, { action: "cycle", dir }) as Promise<{ task: Task }>,
  setAssignee: (id: string, userId: string) =>
    patchTask(id, { action: "setAssignee", userId }) as Promise<{ task: Task; activity: Activity }>,
  logTime: (id: string, minutes: number) =>
    patchTask(id, { action: "logTime", minutes }) as Promise<{ task: Task; activity: Activity }>,
  toggleSub: (id: string, index: number) =>
    patchTask(id, { action: "toggleSub", index }) as Promise<{ task: Task }>,
  toggleTag: (id: string, tagId: string) =>
    patchTask(id, { action: "toggleTag", tagId }) as Promise<{ task: Task }>,
  deleteTask: (id: string) =>
    req<{ removedId: string; activity: Activity }>(`/api/tasks/${id}`, { method: "DELETE" }),

  // users
  inviteUser: (input: InviteInput) =>
    req<{ user: User; activity: Activity }>("/api/users", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  setRole: (id: string, role: Role) =>
    patchUser(id, { action: "setRole", role }) as Promise<{ user: User; activity: Activity }>,
  setUserStatus: (id: string, status: UserStatus) =>
    patchUser(id, { action: "setStatus", status }) as Promise<{ user: User }>,
  resetPassword: (id: string) =>
    patchUser(id, { action: "resetPw" }) as Promise<{ activity: Activity; user: User }>,
  removeUser: (id: string) =>
    req<{ removedId: string; reassigned: Task[] }>(`/api/users/${id}`, { method: "DELETE" }),
};

export type { CreateTaskInput, EditTaskInput, InviteInput };
