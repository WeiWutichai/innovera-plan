"use client";

import { useRef } from "react";
import { usePlanner } from "@/store/planner";
import { useCtx } from "@/store/hooks";
import {
  stats,
  todayFocus,
  projectProgress,
  listGroups,
  kanbanCols,
  calendarDays,
  calendarSelected,
  timeline,
  quadrants,
  teamRows,
  timeSummary,
} from "@/lib/selectors";
import { Avatar, Icon, ProgressBar, ProjectDot, Tag, TaskCard, TaskRow } from "@/components/ui";

function StatTile({ value, label, color }: { value: number | string; label: string; color: string }) {
  return (
    <div style={{ border: "1px solid var(--color-divider)", background: "var(--color-surface)", padding: "13px 14px" }}>
      <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 30, lineHeight: 1, color }}>{value}</div>
      <div style={{ fontSize: 10.5, color: "var(--color-neutral-700)", marginTop: 7, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
    </div>
  );
}

function Section({ icon, title }: { icon: string; title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "18px 0 10px" }}>
      <Icon name={icon} size={18} style={{ color: "var(--color-accent)" }} />
      <h3 style={{ margin: 0, fontSize: 15 }}>{title}</h3>
    </div>
  );
}

// ── Dashboard ────────────────────────────────────────────────────────────────
export function MDashboard() {
  const { L, actions } = usePlanner();
  const ctx = useCtx();
  const cards = stats(ctx);
  const focus = todayFocus(ctx);
  const progress = projectProgress(ctx);
  const overdueCount = cards[1].value;

  return (
    <>
      {overdueCount > 0 && (
        <div onClick={actions.toggleNotif} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 13px", background: "var(--color-accent-100)", borderLeft: "3px solid var(--color-accent)", cursor: "pointer", marginBottom: 14 }}>
          <Icon name="alert-triangle" size={18} style={{ color: "var(--color-accent)" }} />
          <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{L.overdue_title}: {overdueCount}{L.unit_task}</span>
          <Icon name="chevron-right" size={18} style={{ color: "var(--color-accent)" }} />
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {cards.map((s) => (
          <StatTile key={s.key} value={s.value} label={s.label} color={s.color} />
        ))}
      </div>

      <Section icon="target" title={L.focus_today} />
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {focus.map((t) => (
          <TaskRow key={t.id} t={t} onOpen={() => actions.selectTask(t.id)} onToggleDone={(e) => { e.stopPropagation(); actions.toggleDone(t.id, t.done); }} />
        ))}
        {focus.length === 0 && (
          <div style={{ padding: 20, border: "1px dashed var(--color-divider)", fontSize: 13, color: "var(--color-neutral-600)", textAlign: "center" }}>{L.no_focus}</div>
        )}
      </div>

      <Section icon="bar-chart-3" title={L.proj_progress} />
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
    </>
  );
}

// ── List ─────────────────────────────────────────────────────────────────────
export function MList() {
  const { actions } = usePlanner();
  const ctx = useCtx();
  const groups = listGroups(ctx);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {groups.map((g) => (
        <div key={g.key}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <h3 style={{ fontSize: 13, margin: 0, color: g.color, textTransform: "uppercase", letterSpacing: "0.04em" }}>{g.label}</h3>
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

// ── Kanban (horizontal scroll) ───────────────────────────────────────────────
export function MKanban() {
  const { state, L, actions } = usePlanner();
  const ctx = useCtx();
  const cols = kanbanCols(ctx);
  const dragId = useRef<string | null>(null);
  return (
    <div style={{ display: "flex", gap: 12, overflowX: "auto", margin: "0 -16px", padding: "0 16px 4px" }} className="no-scrollbar">
      {cols.map((c) => {
        const hot = state.dragCol === c.status;
        return (
          <div
            key={c.status}
            onDragOver={(e) => { e.preventDefault(); if (state.dragCol !== c.status) actions.setDragCol(c.status); }}
            onDrop={(e) => { e.preventDefault(); const id = dragId.current; dragId.current = null; actions.setDragCol(null); if (id) actions.setStatus(id, c.status); }}
            style={{ width: 240, flex: "none", background: hot ? "var(--color-accent-100)" : "var(--color-surface)", border: `1px solid ${hot ? "var(--color-accent)" : "var(--color-divider)"}`, display: "flex", flexDirection: "column" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 12px", borderBottom: "2px solid var(--color-divider)" }}>
              <span style={{ width: 9, height: 9, background: c.dot }} />
              <span style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{c.label}</span>
              <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--color-neutral-600)" }}>{c.count}</span>
            </div>
            <div style={{ padding: 9, display: "flex", flexDirection: "column", gap: 8 }}>
              {c.tasks.map((t) => (
                <TaskCard
                  key={t.id}
                  t={t}
                  prevLabel={L.status_prev}
                  nextLabel={L.status_next}
                  onOpen={() => actions.selectTask(t.id)}
                  onDragStart={(e) => { dragId.current = t.id; e.dataTransfer.effectAllowed = "move"; }}
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
export function MCalendar() {
  const { state, L, actions } = usePlanner();
  const ctx = useCtx();
  const days = calendarDays(ctx);
  const sel = calendarSelected(ctx, state.calSel);
  const calTitle = ctx.lang === "en" ? "July 2026" : "กรกฎาคม 2026";
  return (
    <div>
      <h3 style={{ margin: "0 0 12px", fontSize: 17 }}>{calTitle}</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
        {L.weekdays.map((w, i) => (
          <div key={i} style={{ textAlign: "center", fontSize: 10, textTransform: "uppercase", color: "var(--color-neutral-600)", padding: "2px 0" }}>{w}</div>
        ))}
        {days.map((d) => {
          const isSel = d.iso === state.calSel;
          return (
            <button
              key={d.iso}
              onClick={() => actions.setCalSel(d.iso)}
              style={{ aspectRatio: "1", border: "1px solid var(--color-divider)", background: isSel ? "var(--color-accent)" : d.isToday ? "var(--color-accent-100)" : d.inMonth ? "var(--color-bg)" : "var(--color-surface)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, padding: 0 }}
            >
              <span style={{ fontSize: 12, color: isSel ? "var(--color-bg)" : d.isToday ? "var(--color-accent)" : d.inMonth ? "var(--color-text)" : "var(--color-neutral-400)", fontWeight: d.isToday || isSel ? 800 : 400 }}>{d.num}</span>
              {d.count > 0 && <span style={{ width: 5, height: 5, background: isSel ? "var(--color-bg)" : "var(--color-accent)" }} />}
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 9, margin: "16px 0 10px" }}>
        <Icon name="calendar" size={18} style={{ color: "var(--color-accent)" }} />
        <h4 style={{ margin: 0, fontSize: 15 }}>{sel.label}</h4>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {sel.tasks.map((t) => (
          <TaskRow key={t.id} t={t} onOpen={() => actions.selectTask(t.id)} onToggleDone={(e) => { e.stopPropagation(); actions.toggleDone(t.id, t.done); }} />
        ))}
        {sel.tasks.length === 0 && (
          <div style={{ padding: 18, border: "1px dashed var(--color-divider)", fontSize: 13, color: "var(--color-neutral-600)", textAlign: "center" }}>{L.cal_empty}</div>
        )}
      </div>
    </div>
  );
}

// ── Timeline (stacked project tracks) ────────────────────────────────────────
export function MTimeline() {
  const { L, actions } = usePlanner();
  const ctx = useCtx();
  const { months, todayLeft, rows } = timeline(ctx);
  return (
    <div>
      <div style={{ display: "flex", borderBottom: "2px solid var(--color-divider)", marginBottom: 10 }}>
        {months.map((m, i) => (
          <div key={i} style={{ flex: "none", width: `${m.w}%`, padding: "4px 4px", fontSize: 9.5, textTransform: "uppercase", color: "var(--color-neutral-600)", borderLeft: "1px solid var(--color-divider)" }}>{m.label}</div>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {rows.map((r) => (
          <div key={r.id} onClick={() => actions.setView("list")} style={{ border: "1px solid var(--color-divider)", padding: 12, background: "var(--color-surface)", cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ width: 9, height: 9, flex: "none", background: r.dot }} />
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</span>
              <span style={{ fontSize: 11, color: "var(--color-neutral-600)" }}>{r.pctLabel}</span>
            </div>
            <div style={{ fontSize: 11, color: "var(--color-neutral-600)", marginBottom: 8 }}>{r.rangeLabel}</div>
            <div style={{ position: "relative", height: 22, background: "var(--color-neutral-200)" }}>
              {months.map((m, i) => (
                <div key={i} style={{ position: "absolute", top: 0, bottom: 0, left: `${m.left}%`, width: 1, background: "var(--color-divider)" }} />
              ))}
              <div style={{ position: "absolute", top: 0, bottom: 0, left: `${r.left}%`, width: `${r.width}%`, background: "var(--color-neutral-300)", overflow: "hidden" }}>
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${r.pct}%`, background: "var(--color-accent)" }} />
              </div>
              <div style={{ position: "absolute", top: -3, bottom: -3, left: `${todayLeft}%`, width: 2, background: "var(--color-accent)" }} />
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 12, fontSize: 11, color: "var(--color-neutral-600)" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 16, height: 8, background: "var(--color-accent)" }} />{L.legend_done}</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 2, height: 12, background: "var(--color-accent)" }} />{L.legend_today}</span>
      </div>
    </div>
  );
}

// ── Time summary ─────────────────────────────────────────────────────────────
export function MTime() {
  const { state, L } = usePlanner();
  const ctx = useCtx();
  const { weekBars, timeStats, projEffort } = timeSummary(ctx, state.weekLog);
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        {timeStats.map((s, i) => (
          <div key={i} style={{ border: "1px solid var(--color-divider)", background: "var(--color-surface)", padding: "12px 12px" }}>
            <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 19, lineHeight: 1.1 }}>{s.value}</div>
            <div style={{ fontSize: 10, color: "var(--color-neutral-700)", marginTop: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>{s.label}</div>
          </div>
        ))}
      </div>

      <Section icon="clock" title={L.time_7d} />
      <div style={{ border: "1px solid var(--color-divider)", background: "var(--color-surface)", padding: "14px 12px 10px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 130, padding: "0 2px" }}>
          {weekBars.map((b, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5, height: "100%", justifyContent: "flex-end" }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: b.numColor }}>{b.hLabel}</span>
              <div style={{ width: "100%", height: `${b.h}%`, background: b.barColor, minHeight: 3 }} />
              <span style={{ fontSize: 10, color: "var(--color-neutral-600)" }}>{b.label}</span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, color: "var(--color-neutral-600)", marginTop: 8, textAlign: "right" }}>{L.unit_note}</div>
      </div>

      <Section icon="folder-git-2" title={L.time_by_proj} />
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {projEffort.map((p) => (
          <div key={p.id}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ width: 9, height: 9, flex: "none", background: p.dot }} />
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
              <span style={{ fontSize: 12, color: "var(--color-neutral-600)" }}>{p.label}</span>
            </div>
            <ProgressBar pct={p.w} height={8} fill="var(--color-accent)" />
            <div style={{ fontSize: 11, color: "var(--color-neutral-600)", marginTop: 5 }}>{p.estLabel}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16, fontSize: 11.5, color: "var(--color-neutral-600)", lineHeight: 1.5 }}>{L.time_tip}</div>
    </div>
  );
}

// ── Matrix (vertical stack) ──────────────────────────────────────────────────
export function MMatrix() {
  const { L, actions } = usePlanner();
  const ctx = useCtx();
  const quads = quadrants(ctx);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {quads.map((q) => (
        <div key={q.key} style={{ border: "1px solid var(--color-divider)", borderTop: `3px solid ${q.accent}`, background: "var(--color-surface)", padding: 14 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 9, marginBottom: 4 }}>
            <Tag cls={q.tagClass}>{q.tag}</Tag>
            <h4 style={{ margin: 0, fontSize: 15 }}>{q.title}</h4>
            <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--color-neutral-600)" }}>{q.count}</span>
          </div>
          <div style={{ fontSize: 12, color: "var(--color-neutral-600)", marginBottom: 10 }}>{q.hint}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {q.tasks.map((t) => (
              <div key={t.id} onClick={() => actions.selectTask(t.id)} style={{ cursor: "pointer", padding: "9px 11px", border: "1px solid var(--color-divider)", background: "var(--color-bg)", display: "flex", alignItems: "center", gap: 9 }}>
                <ProjectDot color={t.projDot} />
                <span style={{ flex: 1, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</span>
                <Tag cls={t.dueClass}>{t.dueLabel}</Tag>
              </div>
            ))}
            {q.tasks.length === 0 && (
              <div style={{ fontSize: 12, color: "var(--color-neutral-500)", textAlign: "center", padding: "8px 0" }}>{L.matrix_empty}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Team ─────────────────────────────────────────────────────────────────────
export function MTeam() {
  const { L, actions } = usePlanner();
  const ctx = useCtx();
  const rows = teamRows(ctx);
  return (
    <div>
      <button className="btn btn-secondary" style={{ width: "100%", justifyContent: "center", marginBottom: 14 }} onClick={actions.openInvite}>
        <Icon name="user-plus" size={16} /><span>{L.invite}</span>
      </button>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {rows.map((u) => (
          <div key={u.id} style={{ border: "1px solid var(--color-divider)", padding: 12, background: "var(--color-surface)", opacity: Number(u.rowOpacity) }}>
            <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 11 }}>
              <Avatar initials={u.initials} bg={u.avatarBg} size={34} font={13} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name}</div>
                <div style={{ fontSize: 12, color: "var(--color-neutral-600)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}</div>
              </div>
              <Tag cls={u.statusCls}>{u.statusLabel}</Tag>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button className="btn btn-secondary" style={{ fontSize: 12, minHeight: 32 }} onClick={() => actions.cycleRole(u.id)}>{u.roleLabel}</button>
              <span style={{ fontSize: 12, color: "var(--color-neutral-600)" }}>{u.assigned}{L.unit_task}</span>
              <button className="btn btn-ghost" style={{ marginLeft: "auto" }} onClick={() => actions.toggleUserStatus(u.id, u.nextStatus)}>{u.toggleLabel}</button>
              {u.canRemove && (
                <button className="btn btn-icon btn-secondary" onClick={() => actions.removeUser(u.id)}><Icon name="trash-2" size={15} /></button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
