// ─────────────────────────────────────────────────────────────────────────
// Domain types — the data model behind INNOVERA PLAN.
// Mirrors the Claude Design prototype (project/Work Planner.dc.html).
// ─────────────────────────────────────────────────────────────────────────

export type Lang = "th" | "en";

/** Status values, in workflow order. */
export type Status = "Backlog" | "To Do" | "In Progress" | "Review" | "Done";

export const STATUS_ORDER: Status[] = [
  "Backlog",
  "To Do",
  "In Progress",
  "Review",
  "Done",
];

export type Role = "admin" | "member" | "viewer";
export type UserStatus = "active" | "invited" | "disabled";

/** Eisenhower quadrant key. */
export type QuadKey = "do" | "plan" | "quick" | "later";

export interface Project {
  id: string;
  name: string;
  /** CSS colour token used for the project dot. */
  dot: string;
  /** ISO date (yyyy-mm-dd). */
  start: string;
  /** ISO date (yyyy-mm-dd). */
  due: string;
  stack: string[];
  arch: string;
  repo: string;
  notes: string;
}

export interface Subtask {
  t: string;
  d: boolean;
}

export interface Task {
  id: string;
  /** Project id. */
  p: string;
  title: string;
  status: Status;
  /** Important. */
  imp: boolean;
  /** Urgent. */
  urg: boolean;
  /** ISO date or null. */
  due: string | null;
  /** Estimated hours. */
  est: number;
  /** Hours spent. */
  spent: number;
  desc: string;
  subs: Subtask[];
  tags: string[];
  /** Assignee user id. */
  assignee: string;
}

export interface Tag {
  id: string;
  label: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  /** True for the current signed-in user. */
  me?: boolean;
}

export type ActivityType =
  | "add"
  | "status"
  | "time"
  | "invite"
  | "role"
  | "assign"
  | "reset"
  | "del"
  | "edit";

export interface Activity {
  actor: string;
  type: ActivityType;
  /** Epoch milliseconds. */
  ts: number;
  title?: string;
  status?: Status;
  amount?: string;
  name?: string;
  role?: Role;
}

/** The full dataset returned by the bootstrap endpoint. */
export interface Bootstrap {
  projects: Project[];
  tasks: Task[];
  tags: Tag[];
  users: User[];
  activity: Activity[];
}

/** The Add / Edit task form shape. */
export interface TaskForm {
  title: string;
  projectId: string;
  due: string;
  status: Status;
  urgent: boolean;
  important: boolean;
  tags: string[];
}

/** The invite-user form shape. */
export interface InviteForm {
  name: string;
  email: string;
  role: Role;
}

export type ViewKey =
  | "dashboard"
  | "list"
  | "kanban"
  | "calendar"
  | "timeline"
  | "matrix"
  | "team"
  | "activity"
  | "time";

/** Views shown in the desktop sidebar, in order. */
export const DESKTOP_VIEWS: ViewKey[] = [
  "dashboard",
  "list",
  "kanban",
  "calendar",
  "timeline",
  "matrix",
  "team",
  "activity",
];

/** Views shown on mobile (tab bar + "More"), in order. */
export const MOBILE_VIEWS: ViewKey[] = [
  "dashboard",
  "list",
  "kanban",
  "calendar",
  "timeline",
  "time",
  "matrix",
  "team",
];
