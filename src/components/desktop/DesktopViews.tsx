"use client";

import { useRef } from "react";
import { usePlanner } from "@/store/planner";
import { useCtx } from "@/store/hooks";
import {
  stats,
  todayFocus,
  projectProgress,
  upcoming,
  listGroups,
  kanbanCols,
  calendarDays,
  timeline,
  quadrants,
  teamRows,
} from "@/lib/selectors";
import { activityText, initials, relTime } from "@/lib/domain";
import { Avatar, ProjectDot, ProgressBar, SectionHeading, Tag, TaskCard, TaskRow } from "@/components/ui";
import { Icon as I } from "@/components/Icon";

// ── Dashboard ────────────────────────────────────────────────────────────────
export function DashboardView() {
  const { L, actions } = usePlanner();
  const ctx = useCtx();
  const cards = stats(ctx);
  const focus = todayFocus(ctx);
  const progress = projectProgress(ctx);
  const up = upcoming(ctx);

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 26 }}>
        {cards.map((s) => (
          <div key={s.key} style={{ border: "1px solid var(--color-divider)", background: "var(--color-surface)", padding: "16px 18px" }}>
            <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 36, lineHeight: 1, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "var(--color-neutral-700)", marginTop: 9, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.35fr 1fr", gap: 26, marginBottom: 26 }}>
        <div>
          <SectionHeading icon="target">{L.focus_today}</SectionHeading>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {focus.map((t) => (
              <TaskRow key={t.id} t={t} onOpen={() => actions.selectTask(t.id)} onToggleDone={(e) => { e.stopPropagation(); actions.toggleDone(t.id, t.done); }} />
            ))}
            {focus.length === 0 && (
              <div style={{ padding: 20, border: "1px dashed var(--color-divider)", fontSize: 13, color: "var(--color-neutral-600)", textAlign: "center" }}>{L.no_focus}</div>
            )}
          </div>
        </div>
        <div>
          <SectionHeading icon="bar-chart-3">{L.proj_progress}</SectionHeading>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {progress.map((p) => (
              <div key={p.id}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ width: 9, height: 9, flex: "none", background: p.dot }} />
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
                  <span style={{ fontSize: 12, color: "var(--color-neutral-600)" }}>{p.pctLabel}</span>
                </div>
                <ProgressBar pct={p.pct} />
                <div style={{ fontSize: 11, color: "var(--color-neutral-600)", marginTop: 5 }}>{p.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <SectionHeading icon="alarm-clock">{L.upcoming_h}</SectionHeading>
        <table className="table">
          <thead>
            <tr>
              <th>{L.th_task}</th>
              <th>{L.th_project}</th>
              <th>{L.th_priority}</th>
              <th style={{ textAlign: "right" }}>{L.th_due}</th>
            </tr>
          </thead>
          <tbody>
            {up.map((t) => (
              <tr key={t.id} onClick={() => actions.selectTask(t.id)} style={{ cursor: "pointer" }}>
                <td style={{ fontWeight: 600 }}>{t.title}</td>
                <td>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                    <span style={{ width: 8, height: 8, background: t.projDot }} />
                    {t.projectName}
                  </span>
                </td>
                <td><Tag cls={t.quadClass}>{t.quadLabel}</Tag></td>
                <td style={{ textAlign: "right" }}><Tag cls={t.dueClass}>{t.dueLabel}</Tag></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ── List ─────────────────────────────────────────────────────────────────────
export function ListView() {
  const { actions } = usePlanner();
  const ctx = useCtx();
  const groups = listGroups(ctx);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 920 }}>
      {groups.map((g) => (
        <div key={g.key}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <h3 style={{ fontSize: 15, margin: 0, color: g.color, textTransform: "uppercase", letterSpacing: "0.04em" }}>{g.label}</h3>
            <span style={{ fontSize: 12, color: "var(--color-neutral-600)" }}>{g.count}</span>
            <div style={{ flex: 1, height: 2, background: "var(--color-divider)" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {g.tasks.map((t) => (
              <TaskRow key={t.id} t={t} meta onOpen={() => actions.selectTask(t.id)} onToggleDone={(e) => { e.stopPropagation(); actions.toggleDone(t.id, t.done); }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Kanban ───────────────────────────────────────────────────────────────────
export function KanbanView() {
  const { state, L, actions } = usePlanner();
  const ctx = useCtx();
  const cols = kanbanCols(ctx);
  const dragId = useRef<string | null>(null);

  return (
    <div style={{ display: "flex", gap: 14, alignItems: "flex-start", height: "100%", paddingBottom: 6 }}>
      {cols.map((c) => {
        const hot = state.dragCol === c.status;
        return (
          <div
            key={c.status}
            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; if (state.dragCol !== c.status) actions.setDragCol(c.status); }}
            onDrop={(e) => { e.preventDefault(); const id = dragId.current; dragId.current = null; actions.setDragCol(null); if (id) actions.setStatus(id, c.status); }}
            style={{ width: 262, flex: "none", background: hot ? "var(--color-accent-100)" : "var(--color-surface)", border: `1px solid ${hot ? "var(--color-accent)" : "var(--color-divider)"}`, display: "flex", flexDirection: "column", maxHeight: "100%" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 14px", borderBottom: "2px solid var(--color-divider)" }}>
              <span style={{ width: 9, height: 9, background: c.dot }} />
              <span style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{c.label}</span>
              <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--color-neutral-600)" }}>{c.count}</span>
            </div>
            <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 8, overflow: "auto" }}>
              {c.tasks.map((t) => (
                <TaskCard
                  key={t.id}
                  t={t}
                  prevLabel={L.status_prev}
                  nextLabel={L.status_next}
                  onOpen={() => actions.selectTask(t.id)}
                  onDragStart={(e) => { dragId.current = t.id; e.dataTransfer.effectAllowed = "move"; try { e.dataTransfer.setData("text/plain", t.id); } catch { /* noop */ } }}
                  onDragEnd={() => { dragId.current = null; if (state.dragCol) actions.setDragCol(null); }}
                  onPrev={(e) => { e.stopPropagation(); actions.cycleStatus(t.id, -1); }}
                  onNext={(e) => { e.stopPropagation(); actions.cycleStatus(t.id, 1); }}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Calendar ─────────────────────────────────────────────────────────────────
export function CalendarView() {
  const { L, actions } = usePlanner();
  const ctx = useCtx();
  const days = calendarDays(ctx);
  const calTitle = ctx.lang === "en" ? "July 2026" : "กรกฎาคม 2026";
  return (
    <div style={{ maxWidth: 1040 }}>
      <h3 style={{ margin: "0 0 14px", fontSize: 18 }}>{calTitle}</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", borderLeft: "1px solid var(--color-divider)", borderTop: "1px solid var(--color-divider)" }}>
        {L.weekdays.map((w, i) => (
          <div key={i} style={{ padding: "7px 9px", borderRight: "1px solid var(--color-divider)", borderBottom: "2px solid var(--color-divider)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-neutral-600)", textAlign: "right", background: "var(--color-surface)" }}>{w}</div>
        ))}
        {days.map((d) => (
          <div key={d.iso} style={{ minHeight: 98, padding: 6, borderRight: "1px solid var(--color-divider)", borderBottom: "1px solid var(--color-divider)", background: d.isToday ? "var(--color-accent-100)" : d.inMonth ? "var(--color-bg)" : "var(--color-surface)", display: "flex", flexDirection: "column", gap: 3 }}>
            <div style={{ fontSize: 12, textAlign: "right", color: d.isToday ? "var(--color-accent)" : d.inMonth ? "var(--color-text)" : "var(--color-neutral-400)", fontWeight: d.isToday ? 800 : 400 }}>{d.num}</div>
            {d.tasks.map((t) => (
              <div key={t.id} onClick={() => actions.selectTask(t.id)} className={`tag ${t.dueClass}`} style={{ cursor: "pointer", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: 10.5, padding: "2px 6px" }}>{t.title}</div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Timeline / Gantt ─────────────────────────────────────────────────────────
export function TimelineView() {
  const { L, actions } = usePlanner();
  const ctx = useCtx();
  const { months, todayLeft, rows } = timeline(ctx);
  return (
    <div style={{ minWidth: 820 }}>
      <div style={{ display: "flex", borderBottom: "2px solid var(--color-divider)" }}>
        <div style={{ width: 190, flex: "none" }} />
        <div style={{ flex: 1, display: "flex" }}>
          {months.map((m, i) => (
            <div key={i} style={{ flex: "none", width: `${m.w}%`, padding: "6px 8px", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--color-neutral-600)", borderLeft: "1px solid var(--color-divider)" }}>{m.label}</div>
          ))}
        </div>
      </div>
      {rows.map((r) => (
        <div key={r.id} style={{ display: "flex", alignItems: "center", borderBottom: "1px solid var(--color-divider)", minHeight: 54 }}>
          <div style={{ width: 190, flex: "none", padding: "8px 14px 8px 2px" }}>
            <div onClick={() => { actions.setFilter(r.id); actions.setView("list"); }} style={{ fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <span style={{ width: 9, height: 9, flex: "none", background: r.dot }} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</span>
            </div>
            <div style={{ fontSize: 11, color: "var(--color-neutral-600)", marginTop: 3 }}>{r.rangeLabel}</div>
          </div>
          <div style={{ flex: 1, position: "relative", height: 36 }}>
            {months.map((m, i) => (
              <div key={i} style={{ position: "absolute", top: 0, bottom: 0, left: `${m.left}%`, width: 1, background: "var(--color-divider)" }} />
            ))}
            <div style={{ position: "absolute", top: -7, bottom: -7, left: `${todayLeft}%`, width: 2, background: "var(--color-accent)" }} />
            <div style={{ position: "absolute", top: 8, height: 20, left: `${r.left}%`, width: `${r.width}%`, background: "var(--color-neutral-300)", overflow: "hidden" }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${r.pct}%`, background: "var(--color-accent)" }} />
              <span style={{ position: "absolute", left: 8, top: 0, lineHeight: "20px", fontSize: 11, fontWeight: 600, color: "var(--color-neutral-900)" }}>{r.pctLabel}</span>
            </div>
          </div>
        </div>
      ))}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 14, fontSize: 12, color: "var(--color-neutral-600)" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 22, height: 8, background: "var(--color-accent)" }} />{L.legend_done}</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 22, height: 8, background: "var(--color-neutral-300)" }} />{L.legend_left}</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 2, height: 14, background: "var(--color-accent)" }} />{L.legend_today}</span>
      </div>
    </div>
  );
}

// ── Matrix ───────────────────────────────────────────────────────────────────
export function MatrixView() {
  const { L, actions } = usePlanner();
  const ctx = useCtx();
  const quads = quadrants(ctx);
  return (
    <div style={{ maxWidth: 1000 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, background: "var(--color-divider)", border: "2px solid var(--color-divider)" }}>
        {quads.map((q) => (
          <div key={q.key} style={{ background: "var(--color-bg)", padding: 16, minHeight: 210 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 9, marginBottom: 6 }}>
              <Tag cls={q.tagClass}>{q.tag}</Tag>
              <h4 style={{ margin: 0, fontSize: 16 }}>{q.title}</h4>
              <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--color-neutral-600)" }}>{q.count}</span>
            </div>
            <div style={{ fontSize: 12, color: "var(--color-neutral-600)", marginBottom: 12 }}>{q.hint}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {q.tasks.map((t) => (
                <div key={t.id} onClick={() => actions.selectTask(t.id)} style={{ cursor: "pointer", padding: "9px 11px", border: "1px solid var(--color-divider)", background: "var(--color-surface)", display: "flex", alignItems: "center", gap: 9 }}>
                  <ProjectDot color={t.projDot} />
                  <span style={{ flex: 1, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</span>
                  <Tag cls={t.dueClass}>{t.dueLabel}</Tag>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 10, fontSize: 12, color: "var(--color-neutral-600)" }}>{L.matrix_axis}</div>
    </div>
  );
}

// ── Team ─────────────────────────────────────────────────────────────────────
export function TeamView() {
  const { state, L, actions } = usePlanner();
  const ctx = useCtx();
  const rows = teamRows(ctx);
  const membersText = L.members_pre + state.users.length + L.members_post;
  const grid = "1fr 132px 92px 122px auto";
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: "var(--color-neutral-600)" }}>{membersText}</div>
        <button className="btn btn-secondary" style={{ marginLeft: "auto" }} onClick={actions.openInvite}>
          <I name="user-plus" /><span>{L.invite}</span>
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: grid, gap: 12, padding: "0 4px 9px", borderBottom: "2px solid var(--color-divider)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-neutral-600)" }}>
        <span>{L.th_member}</span><span>{L.th_role}</span><span>{L.th_status}</span><span>{L.th_assigned}</span><span />
      </div>
      {rows.map((u) => (
        <div key={u.id} style={{ display: "grid", gridTemplateColumns: grid, gap: 12, alignItems: "center", padding: "12px 4px", borderBottom: "1px solid var(--color-divider)", opacity: Number(u.rowOpacity) }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
            <Avatar initials={u.initials} bg={u.avatarBg} size={34} font={13} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name}</div>
              <div style={{ fontSize: 12, color: "var(--color-neutral-600)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}</div>
            </div>
          </div>
          <button className="btn btn-secondary" style={{ minHeight: 32, width: "100%", justifyContent: "flex-start", fontSize: 12 }} onClick={() => actions.cycleRole(u.id)}>{u.roleLabel}</button>
          <span><Tag cls={u.statusCls}>{u.statusLabel}</Tag></span>
          <span style={{ fontSize: 13 }}>{u.assigned}{L.unit_task}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
            <button className="btn btn-icon btn-secondary" title={L.reset_pw} onClick={() => actions.resetPassword(u.id)}><I name="key-round" size={15} /></button>
            <button className="btn btn-ghost" onClick={() => actions.toggleUserStatus(u.id, u.nextStatus)}>{u.toggleLabel}</button>
            {u.canRemove && (
              <button className="btn btn-icon btn-secondary" onClick={() => actions.removeUser(u.id)}><I name="trash-2" size={15} /></button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Activity ─────────────────────────────────────────────────────────────────
export function ActivityView() {
  const { state, L } = usePlanner();
  const now = Date.now();
  return (
    <div style={{ maxWidth: 720, display: "flex", flexDirection: "column" }}>
      {state.activity.map((e, idx) => {
        const u = state.users.find((x) => x.id === e.actor) || { name: "?", me: false };
        return (
          <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 4px", borderBottom: "1px solid var(--color-divider)" }}>
            <Avatar initials={initials(u.name)} bg={"me" in u && u.me ? "var(--color-accent)" : "var(--color-neutral-700)"} size={32} font={12} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, lineHeight: 1.5 }}>
                <span style={{ fontWeight: 600 }}>{u.name}</span> {activityText(e, L, state.lang)}
              </div>
              <div style={{ fontSize: 11, color: "var(--color-neutral-600)", marginTop: 3 }}>{relTime(e.ts, now, state.lang)}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
