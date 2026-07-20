// ─────────────────────────────────────────────────────────────────────────
// Selectors — derive every view's data from the raw records + active filters.
// Pure functions ported from the prototype's renderVals(). Components attach
// the event handlers; these return only data.
// ─────────────────────────────────────────────────────────────────────────

import { diffDays, iso, parse, TODAY, fmtShort } from "./dates";
import { decorate, DecoratedTask, fmtHours, quad, STATUS_DOT } from "./domain";
import type { Dict } from "./i18n";
import {
  Lang,
  Project,
  Status,
  STATUS_ORDER,
  Tag,
  Task,
  User,
} from "./types";

export interface SelectCtx {
  projects: Project[];
  tasks: Task[];
  users: User[];
  tags: Tag[];
  L: Dict;
  lang: Lang;
  filter: string;
  tagFilter: string | null;
  assigneeFilter: string | null;
}

const dec = (ctx: SelectCtx, t: Task) => decorate(t, ctx.projects, ctx.tags, ctx.L);

/** Tasks matching the active project / tag / assignee filters. */
export function filteredTasks(ctx: SelectCtx): Task[] {
  const { filter: f, tagFilter: tf, assigneeFilter: af } = ctx;
  return ctx.tasks.filter(
    (t) =>
      (f === "all" || t.p === f) &&
      (!tf || (t.tags || []).includes(tf)) &&
      (!af || t.assignee === af),
  );
}

export const openTasks = (tasks: Task[]) => tasks.filter((t) => t.status !== "Done");

// ── nav / sidebar counts ───────────────────────────────────────────────────
export function navCounts(ctx: SelectCtx) {
  const openCount = openTasks(ctx.tasks).length;
  const calMonthCount = ctx.tasks.filter(
    (t) => t.due && parse(t.due).getMonth() === 6 && parse(t.due).getFullYear() === 2026,
  ).length;
  return { openCount, calMonthCount, projectCount: ctx.projects.length };
}

export function projectFilterCounts(ctx: SelectCtx) {
  const openCount = openTasks(ctx.tasks).length;
  const map: Record<string, number> = { all: openCount };
  for (const p of ctx.projects) {
    map[p.id] = ctx.tasks.filter((t) => t.p === p.id && t.status !== "Done").length;
  }
  return map;
}

// ── dashboard ───────────────────────────────────────────────────────────────
export interface StatCard {
  key: string;
  label: string;
  value: number;
  color: string;
}

export function stats(ctx: SelectCtx): StatCard[] {
  const { L } = ctx;
  const openAll = openTasks(ctx.tasks);
  const overdue = openAll.filter((t) => t.due && diffDays(t.due) < 0);
  const dueWk = openAll.filter((t) => t.due && diffDays(t.due) >= 0 && diffDays(t.due) <= 7);
  const doneCount = ctx.tasks.filter((t) => t.status === "Done").length;
  return [
    { key: "open", label: L.s_open, value: openAll.length, color: "var(--color-text)" },
    { key: "over", label: L.s_over, value: overdue.length, color: overdue.length ? "var(--color-accent)" : "var(--color-text)" },
    { key: "due7", label: L.s_due7, value: dueWk.length, color: "var(--color-text)" },
    { key: "done", label: L.s_done, value: doneCount, color: "var(--color-neutral-600)" },
  ];
}

export function todayFocus(ctx: SelectCtx): DecoratedTask[] {
  const open = openTasks(filteredTasks(ctx));
  return open
    .filter((t) => {
      const q = quad(t, ctx.L);
      const d = t.due ? diffDays(t.due) : 999;
      return d <= 0 || q.key === "do";
    })
    .sort((a, b) => (a.due ? diffDays(a.due) : 999) - (b.due ? diffDays(b.due) : 999))
    .map((t) => dec(ctx, t));
}

export interface ProgressRow {
  id: string;
  name: string;
  dot: string;
  pct: number;
  pctLabel: string;
  sub: string;
}

export function projectProgress(ctx: SelectCtx): ProgressRow[] {
  const { L } = ctx;
  return ctx.projects.map((p) => {
    const ts = ctx.tasks.filter((t) => t.p === p.id);
    const dn = ts.filter((t) => t.status === "Done").length;
    const pct = ts.length ? Math.round((dn / ts.length) * 100) : 0;
    return {
      id: p.id,
      name: p.name,
      dot: p.dot,
      pct,
      pctLabel: pct + "%",
      sub: dn + "/" + ts.length + L.done_of + " · " + L.deliver + " " + fmtShort(p.due, L.mon),
    };
  });
}

export function upcoming(ctx: SelectCtx): DecoratedTask[] {
  const open = openTasks(filteredTasks(ctx));
  return open
    .filter((t) => t.due)
    .sort((a, b) => parse(a.due!).getTime() - parse(b.due!).getTime())
    .slice(0, 6)
    .map((t) => dec(ctx, t));
}

// ── list (grouped by due bucket) ─────────────────────────────────────────────
export interface ListGroup {
  key: string;
  label: string;
  color: string;
  count: number;
  tasks: DecoratedTask[];
}

export function listGroups(ctx: SelectCtx): ListGroup[] {
  const { L } = ctx;
  const all = filteredTasks(ctx);
  const open = openTasks(all);
  const buckets: { key: string; label: string; color: string; test: (t: Task) => boolean }[] = [
    { key: "overdue", label: L.b_overdue, color: "var(--color-accent)", test: (t) => !!t.due && diffDays(t.due) < 0 },
    { key: "today", label: L.b_today, color: "var(--color-text)", test: (t) => !!t.due && diffDays(t.due) === 0 },
    { key: "week", label: L.b_week, color: "var(--color-text)", test: (t) => !!t.due && diffDays(t.due) >= 1 && diffDays(t.due) <= 7 },
    { key: "later", label: L.b_later, color: "var(--color-neutral-700)", test: (t) => !!t.due && diffDays(t.due) > 7 },
    { key: "none", label: L.b_none, color: "var(--color-neutral-700)", test: (t) => !t.due },
  ];
  const groups: ListGroup[] = buckets
    .map((b) => {
      const ts = open
        .filter(b.test)
        .sort((a, b2) => (a.due ? parse(a.due).getTime() : 9e15) - (b2.due ? parse(b2.due).getTime() : 9e15));
      return { key: b.key, label: b.label, color: b.color, count: ts.length, tasks: ts.map((t) => dec(ctx, t)) };
    })
    .filter((g) => g.count > 0);
  const doneTs = all.filter((t) => t.status === "Done");
  if (doneTs.length) {
    groups.push({
      key: "done",
      label: L.b_done,
      color: "var(--color-neutral-500)",
      count: doneTs.length,
      tasks: doneTs.map((t) => dec(ctx, t)),
    });
  }
  return groups;
}

// ── kanban ───────────────────────────────────────────────────────────────────
export interface KanbanCol {
  status: Status;
  label: string;
  dot: string;
  count: number;
  tasks: DecoratedTask[];
}

export function kanbanCols(ctx: SelectCtx): KanbanCol[] {
  const all = filteredTasks(ctx);
  return STATUS_ORDER.map((st) => {
    const ts = all.filter((t) => t.status === st);
    return { status: st, label: ctx.L.status[st], dot: STATUS_DOT[st], count: ts.length, tasks: ts.map((t) => dec(ctx, t)) };
  });
}

// ── calendar (July 2026) ─────────────────────────────────────────────────────
export interface CalDay {
  iso: string;
  num: number;
  inMonth: boolean;
  isToday: boolean;
  count: number;
  tasks: DecoratedTask[];
}

export function calendarDays(ctx: SelectCtx): CalDay[] {
  const first = new Date(2026, 6, 1);
  const start = new Date(2026, 6, 1 - first.getDay());
  const todayISO = iso(TODAY);
  const days: CalDay[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const dISO = iso(d);
    const inMonth = d.getMonth() === 6;
    const ts = ctx.tasks.filter((t) => t.due === dISO);
    days.push({
      iso: dISO,
      num: d.getDate(),
      inMonth,
      isToday: dISO === todayISO,
      count: ts.length,
      tasks: ts.map((t) => dec(ctx, t)),
    });
  }
  return days;
}

/** Mobile: agenda for the selected calendar day. */
export function calendarSelected(ctx: SelectCtx, calSel: string) {
  const selD = parse(calSel);
  const label = selD.getDate() + " " + ctx.L.mon[selD.getMonth()] + " 2026";
  const tasks = ctx.tasks.filter((t) => t.due === calSel).map((t) => dec(ctx, t));
  return { label, tasks };
}

// ── timeline / gantt ─────────────────────────────────────────────────────────
export interface GanttMonth {
  label: string;
  w: number;
  left: number;
}
export interface GanttRow {
  id: string;
  name: string;
  dot: string;
  left: number;
  width: number;
  pct: number;
  pctLabel: string;
  rangeLabel: string;
}

const MONTH_DEFS: [number, string, number][] = [
  [4, "พ.ค.", 31],
  [5, "มิ.ย.", 30],
  [6, "ก.ค.", 31],
  [7, "ส.ค.", 31],
  [8, "ก.ย.", 30],
  [9, "ต.ค.", 31],
  [10, "พ.ย.", 30],
  [11, "ธ.ค.", 31],
];

export function timeline(ctx: SelectCtx) {
  const rS = parse("2026-05-01");
  const rE = parse("2026-12-31");
  const tot = (rE.getTime() - rS.getTime()) / 86400000;
  let acc = 0;
  const months: GanttMonth[] = MONTH_DEFS.map((m, i) => {
    const left = (acc / tot) * 100;
    const w = (m[2] / tot) * 100;
    acc += m[2];
    // localize the month label from index
    return { label: ctx.L.mon[m[0]], w, left };
  });
  const todayLeft = ((TODAY.getTime() - rS.getTime()) / 86400000 / tot) * 100;
  const rows: GanttRow[] = ctx.projects.map((p) => {
    const ps = parse(p.start);
    const pd = parse(p.due);
    const left = Math.max(0, ((ps.getTime() - rS.getTime()) / 86400000 / tot) * 100);
    const width = Math.min(100 - left, ((pd.getTime() - ps.getTime()) / 86400000 / tot) * 100);
    const ts = ctx.tasks.filter((t) => t.p === p.id);
    const dn = ts.filter((t) => t.status === "Done").length;
    const pct = ts.length ? Math.round((dn / ts.length) * 100) : 0;
    return {
      id: p.id,
      name: p.name,
      dot: p.dot,
      left,
      width,
      pct,
      pctLabel: pct + "%",
      rangeLabel: fmtShort(p.start, ctx.L.mon) + " – " + fmtShort(p.due, ctx.L.mon),
    };
  });
  return { months, todayLeft, rows };
}

// ── matrix / eisenhower ──────────────────────────────────────────────────────
export interface Quadrant {
  key: "do" | "plan" | "quick" | "later";
  title: string;
  tag: string;
  tagClass: string;
  hint: string;
  accent: string;
  count: number;
  tasks: DecoratedTask[];
}

export function quadrants(ctx: SelectCtx): Quadrant[] {
  const { L } = ctx;
  const open = openTasks(filteredTasks(ctx));
  const defs: { key: Quadrant["key"]; tagClass: string; accent: string }[] = [
    { key: "do", tagClass: "tag-accent", accent: "var(--color-accent)" },
    { key: "plan", tagClass: "tag-neutral", accent: "var(--color-neutral-700)" },
    { key: "quick", tagClass: "tag-accent-2", accent: "var(--color-accent-2-500)" },
    { key: "later", tagClass: "tag-neutral", accent: "var(--color-neutral-400)" },
  ];
  return defs.map((d) => {
    const ts = open.filter((t) => quad(t, L).key === d.key).map((t) => dec(ctx, t));
    const m = L.matrix[d.key];
    return { key: d.key, title: m.t, tag: m.tag, tagClass: d.tagClass, hint: m.hint, accent: d.accent, count: ts.length, tasks: ts };
  });
}

// ── team ─────────────────────────────────────────────────────────────────────
export interface TeamRow {
  id: string;
  name: string;
  email: string;
  role: User["role"];
  status: User["status"];
  me: boolean;
  initials: string;
  roleLabel: string;
  statusLabel: string;
  statusCls: string;
  assigned: number;
  avatarBg: string;
  rowOpacity: string;
  canRemove: boolean;
  nextStatus: User["status"];
  toggleLabel: string;
}

export function teamRows(ctx: SelectCtx): TeamRow[] {
  const { L } = ctx;
  return ctx.users.map((u) => {
    const assigned = ctx.tasks.filter((t) => t.assignee === u.id && t.status !== "Done").length;
    const next: User["status"] = u.status === "invited" ? "active" : u.status === "active" ? "disabled" : "active";
    const toggleLabel = u.status === "invited" ? L.ut_accept : u.status === "active" ? L.ut_disable : L.ut_enable;
    const statusCls = u.status === "active" ? "tag-neutral" : u.status === "invited" ? "tag-outline" : "tag-neutral";
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      me: !!u.me,
      initials: initialsOf(u.name),
      roleLabel: L.role[u.role],
      statusLabel: L.ustatus[u.status],
      statusCls,
      assigned,
      avatarBg: u.me ? "var(--color-accent)" : "var(--color-neutral-700)",
      rowOpacity: u.status === "disabled" ? "0.5" : "1",
      canRemove: !u.me,
      nextStatus: next,
      toggleLabel,
    };
  });
}

function initialsOf(name: string): string {
  return (name || "")
    .split(" ")
    .map((w) => w[0] || "")
    .join("")
    .slice(0, 2);
}

// ── overdue (notifications) ──────────────────────────────────────────────────
export function overdueTasks(ctx: SelectCtx): DecoratedTask[] {
  return openTasks(ctx.tasks)
    .filter((t) => t.due && diffDays(t.due) < 0)
    .sort((a, b) => parse(a.due!).getTime() - parse(b.due!).getTime())
    .map((t) => dec(ctx, t));
}

// ── time summary (mobile only) ───────────────────────────────────────────────
export interface WeekBar {
  label: string;
  date: number;
  hours: number;
  /** hours rounded to 1 decimal, for the bar label */
  hLabel: number;
  h: number;
  barColor: string;
  numColor: string;
  isToday: boolean;
}
export interface TimeStat {
  label: string;
  value: string;
}
export interface ProjEffort {
  id: string;
  name: string;
  dot: string;
  spent: number;
  est: number;
  label: string;
  estLabel: string;
  w: number;
}

export function timeSummary(ctx: SelectCtx, weekLog: number[]) {
  const { L, lang } = ctx;
  const wkMax = Math.max(1, ...weekLog);
  const weekdays = lang === "en" ? ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] : ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
  const weekBars: WeekBar[] = weekLog.map((h, i) => {
    const d = new Date(2026, 6, 6 + i);
    const isToday = i === 6;
    return {
      label: weekdays[d.getDay()],
      date: d.getDate(),
      hours: h,
      hLabel: Math.round(h * 10) / 10,
      h: Math.round((h / wkMax) * 100),
      barColor: isToday ? "var(--color-accent)" : "var(--color-neutral-700)",
      numColor: isToday ? "var(--color-accent)" : "var(--color-neutral-700)",
      isToday,
    };
  });
  const wkTotal = weekLog.reduce((a, b) => a + b, 0);
  const wkAvg = wkTotal / 7;
  let topI = 0;
  weekLog.forEach((h, i) => {
    if (h > weekLog[topI]) topI = i;
  });
  const wkTop = weekBars[topI];
  const hrU = lang === "en" ? "h" : "ชม";
  const timeStats: TimeStat[] = [
    { label: L.total_week, value: Math.round(wkTotal * 10) / 10 + " " + hrU },
    { label: L.avg_day, value: Math.round(wkAvg * 10) / 10 + " " + hrU },
    { label: L.top_day, value: wkTop.label + " " + wkTop.date },
  ];
  const rawEffort = ctx.projects.map((p) => {
    const ts = ctx.tasks.filter((t) => t.p === p.id);
    const sp = ts.reduce((a, t) => a + t.spent, 0);
    const es = ts.reduce((a, t) => a + t.est, 0);
    return { id: p.id, name: p.name, dot: p.dot, spent: sp, est: es, label: fmtHours(sp, lang), estLabel: lang === "en" ? "of " + es + " h" : "จาก " + es + " ชม" };
  });
  const effMax = Math.max(1, ...rawEffort.map((p) => p.spent));
  const projEffort: ProjEffort[] = rawEffort.map((p) => ({ ...p, w: Math.round((p.spent / effMax) * 100) }));
  return { weekBars, timeStats, projEffort };
}
