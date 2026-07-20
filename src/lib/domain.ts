// ─────────────────────────────────────────────────────────────────────────
// Domain logic — the pure functions that turn raw records into view models.
// Ported from the prototype's quad() / dueInfo() / decorate() helpers.
// These are UI-agnostic: components add the event handlers.
// ─────────────────────────────────────────────────────────────────────────

import { diffDays, fmtShort } from "./dates";
import type { Dict } from "./i18n";
import type {
  Activity,
  Lang,
  Project,
  QuadKey,
  Status,
  Tag,
  Task,
} from "./types";

/** Status → dot colour token (kanban / status chips). */
export const STATUS_DOT: Record<Status, string> = {
  Backlog: "var(--color-neutral-400)",
  "To Do": "var(--color-neutral-600)",
  "In Progress": "var(--color-accent)",
  Review: "var(--color-accent-2-500)",
  Done: "var(--color-neutral-800)",
};

export interface QuadInfo {
  key: QuadKey;
  label: string;
  cls: string;
}

/** Eisenhower quadrant for a task. */
export function quad(t: Pick<Task, "imp" | "urg">, L: Dict): QuadInfo {
  if (t.imp && t.urg) return { key: "do", label: L.q_do, cls: "tag-accent" };
  if (t.imp && !t.urg) return { key: "plan", label: L.q_plan, cls: "tag-neutral" };
  if (!t.imp && t.urg) return { key: "quick", label: L.q_quick, cls: "tag-accent-2" };
  return { key: "later", label: L.q_later, cls: "tag-neutral" };
}

export type DueTone = "done" | "none" | "overdue" | "today" | "soon" | "normal";

export interface DueInfo {
  label: string;
  cls: string;
  tone: DueTone;
}

/** Due-date badge for a task. */
export function dueInfo(t: Pick<Task, "status" | "due">, L: Dict): DueInfo {
  if (t.status === "Done") return { label: L.d_done, cls: "tag-neutral", tone: "done" };
  if (!t.due) return { label: L.d_none, cls: "tag-neutral", tone: "none" };
  const d = diffDays(t.due);
  if (d < 0) return { label: L.d_over(-d), cls: "tag-accent", tone: "overdue" };
  if (d === 0) return { label: L.d_today, cls: "tag-outline", tone: "today" };
  if (d === 1) return { label: L.d_tomorrow, cls: "tag-outline", tone: "soon" };
  if (d <= 7) return { label: L.d_in(d), cls: "tag-neutral", tone: "soon" };
  return { label: fmtShort(t.due, L.mon), cls: "tag-neutral", tone: "normal" };
}

export function initials(name: string): string {
  return (name || "")
    .split(" ")
    .map((w) => w[0] || "")
    .join("")
    .slice(0, 2);
}

/** Hours formatter: "6 ชม" / "45 น" (mobile time view). */
export function fmtHours(h: number, lang: Lang): string {
  const en = lang === "en";
  if (h >= 1 || h === 0) return Math.round(h * 10) / 10 + (en ? " h" : " ชม");
  return Math.round(h * 60) + (en ? "m" : " น");
}

/** A task turned into everything a card/row needs to render. No handlers. */
export interface DecoratedTask {
  id: string;
  title: string;
  projectName: string;
  projDot: string;
  status: Status;
  statusLabel: string;
  done: boolean;
  quadKey: QuadKey;
  quadLabel: string;
  quadClass: string;
  dueLabel: string;
  dueClass: string;
  dueTone: DueTone;
  hasSubs: boolean;
  subLabel: string;
  pct: number;
  tagChips: { id: string; label: string }[];
  hasTags: boolean;
  checkBorder: string;
  checkBg: string;
  titleColor: string;
  strike: "line-through" | "none";
}

export function tagLabel(id: string, tags: Tag[]): string {
  return tags.find((g) => g.id === id)?.label ?? id;
}

export function decorate(
  t: Task,
  projects: Project[],
  tags: Tag[],
  L: Dict,
): DecoratedTask {
  const pr = projects.find((p) => p.id === t.p);
  const q = quad(t, L);
  const du = dueInfo(t, L);
  const done = t.status === "Done";
  const total = t.subs.length;
  const dn = t.subs.filter((s) => s.d).length;
  const pct = total ? Math.round((dn / total) * 100) : done ? 100 : 0;
  return {
    id: t.id,
    title: t.title,
    projectName: pr ? pr.name : "",
    projDot: pr ? pr.dot : "var(--color-neutral-500)",
    status: t.status,
    statusLabel: L.status[t.status],
    done,
    quadKey: q.key,
    quadLabel: q.label,
    quadClass: q.cls,
    dueLabel: du.label,
    dueClass: du.cls,
    dueTone: du.tone,
    hasSubs: total > 0,
    subLabel: dn + "/" + total,
    pct,
    tagChips: (t.tags || []).map((id) => ({ id, label: tagLabel(id, tags) })),
    hasTags: (t.tags || []).length > 0,
    checkBorder: done ? "var(--color-accent)" : "var(--color-neutral-400)",
    checkBg: done ? "var(--color-accent)" : "transparent",
    titleColor: done ? "var(--color-neutral-500)" : "var(--color-text)",
    strike: done ? "line-through" : "none",
  };
}

/** "just now" / "5m ago" / "3h ago" / "2d ago". */
export function relTime(ts: number, now: number, lang: Lang): string {
  const en = lang === "en";
  const m = Math.floor((now - ts) / 60000);
  if (m < 1) return en ? "just now" : "เมื่อครู่";
  if (m < 60) return en ? m + "m ago" : m + " นาทีที่แล้ว";
  const h = Math.floor(m / 60);
  if (h < 24) return en ? h + "h ago" : h + " ชม.ที่แล้ว";
  const d = Math.floor(h / 24);
  return en ? d + "d ago" : d + " วันที่แล้ว";
}

/** Human phrasing for an activity event. */
export function activityText(e: Activity, L: Dict, lang: Lang): string {
  const en = lang === "en";
  switch (e.type) {
    case "add":
      return (en ? "added task" : "เพิ่มงาน") + " “" + e.title + "”";
    case "status":
      return (
        (en ? "moved" : "ย้าย") +
        " “" +
        e.title +
        "” → " +
        (e.status ? L.status[e.status] : "")
      );
    case "time":
      return (en ? "logged" : "บันทึกเวลา") + " " + e.amount + " · " + e.title;
    case "invite":
      return (en ? "invited" : "เชิญ") + " " + e.name;
    case "role":
      return (
        (en ? "changed role of" : "เปลี่ยนบทบาท") +
        " " +
        e.name +
        " → " +
        (e.role ? L.role[e.role] : "")
      );
    case "assign":
      return (en ? "assigned" : "มอบหมาย") + " “" + e.title + "” → " + e.name;
    case "reset":
      return (en ? "reset password for" : "รีเซ็ตรหัสผ่านของ") + " " + e.name;
    case "del":
      return (en ? "deleted task" : "ลบงาน") + " “" + e.title + "”";
    case "edit":
      return (en ? "edited task" : "แก้ไขงาน") + " “" + e.title + "”";
    default:
      return e.type;
  }
}
