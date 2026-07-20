"use client";

import { usePlanner } from "@/store/planner";
import { decorate, initials } from "@/lib/domain";
import { STATUS_ORDER } from "@/lib/types";
import { Avatar, Icon, ProgressBar, Tag } from "@/components/ui";

/** The scrollable body of the task detail — shared by the desktop drawer and
 *  the mobile full-screen sheet. Expects a valid selId in the store. */
export function TaskDetailBody({ taskId }: { taskId: string }) {
  const { state, L, actions } = usePlanner();
  const raw = state.tasks.find((t) => t.id === taskId);
  if (!raw) return null;

  const d = decorate(raw, state.projects, state.tags, L);
  const pr = state.projects.find((p) => p.id === raw.p);
  const en = state.lang === "en";
  const timePct = raw.est ? Math.min(100, Math.round((raw.spent / raw.est) * 100)) : 0;
  const timeColor = raw.spent > raw.est ? "var(--color-accent)" : "var(--color-neutral-700)";
  const au = state.users.find((u) => u.id === raw.assignee);
  const assigneeName = au ? au.name : L.unassigned;
  const assigneeBg = au && au.me ? "var(--color-accent)" : "var(--color-neutral-700)";

  const label = (t: string, mb = 7) => (
    <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-neutral-600)", marginBottom: mb }}>{t}</div>
  );

  return (
    <>
      <h2 style={{ fontSize: 22, margin: "0 0 13px", lineHeight: 1.2 }}>{raw.title}</h2>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 20 }}>
        <span style={{ width: 10, height: 10, flex: "none", background: d.projDot }} />
        <span style={{ fontSize: 13, color: "var(--color-neutral-700)" }}>{d.projectName}</span>
        <Tag cls={d.dueClass} style={{ marginLeft: "auto" }}>{d.dueLabel}</Tag>
      </div>

      {label(L.assign_to)}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
        <Avatar initials={au ? initials(au.name) : "?"} bg={assigneeBg} size={30} font={12} />
        <span style={{ flex: 1, fontSize: 14 }}>{assigneeName}</span>
        <button className="btn btn-secondary" onClick={() => actions.cycleAssignee(raw.id)}><Icon name="repeat" size={14} /><span>{L.change}</span></button>
      </div>

      {label(L.status_h)}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 22 }}>
        {STATUS_ORDER.map((st) => {
          const act = raw.status === st;
          return (
            <button key={st} onClick={() => actions.setStatus(raw.id, st)} style={{ padding: "6px 12px", border: `1px solid ${act ? "var(--color-accent)" : "var(--color-divider)"}`, background: act ? "var(--color-accent)" : "transparent", color: act ? "var(--color-bg)" : "var(--color-text)", cursor: "pointer", font: "600 12px var(--font-body)" }}>{L.status[st]}</button>
          );
        })}
      </div>

      {label(L.tags_h)}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 22 }}>
        {state.tags.map((g) => {
          const on = (raw.tags || []).includes(g.id);
          return (
            <button key={g.id} onClick={() => actions.toggleTag(raw.id, g.id)} style={{ padding: "5px 11px", border: `1px solid ${on ? "var(--color-accent)" : "var(--color-divider)"}`, background: on ? "var(--color-accent)" : "transparent", color: on ? "var(--color-bg)" : "var(--color-neutral-700)", cursor: "pointer", font: "600 11.5px var(--font-body)" }}>#{g.label}</button>
          );
        })}
      </div>

      {raw.desc && (
        <>
          {label(L.detail, 6)}
          <p style={{ fontSize: 14, color: "var(--color-neutral-800)", margin: "0 0 22px", lineHeight: 1.65 }}>{raw.desc}</p>
        </>
      )}

      <div style={{ border: "1px solid var(--color-divider)", padding: 14, marginBottom: 22, background: "var(--color-surface)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 11 }}>
          <Icon name="clock" />
          <span style={{ fontSize: 13, fontWeight: 600 }}>{L.time_used}</span>
          <span style={{ marginLeft: "auto", fontSize: 13, fontWeight: 600 }}>{raw.spent}{en ? " h" : " ชม"} <span style={{ color: "var(--color-neutral-600)", fontWeight: 400 }}>/ {raw.est}{en ? " h" : " ชม"}</span></span>
        </div>
        <div style={{ marginBottom: 11 }}><ProgressBar pct={timePct} fill={timeColor} /></div>
        <div style={{ display: "flex", gap: 6 }}>
          <button className="btn btn-secondary" onClick={() => actions.logTime(raw.id, 15)}>{L.log_15}</button>
          <button className="btn btn-secondary" onClick={() => actions.logTime(raw.id, 60)}>{L.log_60}</button>
          <button className="btn btn-secondary" onClick={() => actions.logTime(raw.id, 120)}>{L.log_120}</button>
        </div>
      </div>

      {d.hasSubs && (
        <>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-neutral-600)" }}>{L.subtasks}</span>
            <span style={{ fontSize: 12, color: "var(--color-neutral-600)" }}>{d.subLabel}</span>
          </div>
          <div style={{ marginBottom: 12 }}><ProgressBar pct={d.pct} height={6} /></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 1, marginBottom: 22 }}>
            {raw.subs.map((st, i) => (
              <div key={i} onClick={() => actions.toggleSub(raw.id, i)} style={{ display: "flex", alignItems: "center", gap: 11, padding: 8, cursor: "pointer", fontSize: 14 }}>
                <span style={{ width: 18, height: 18, flex: "none", border: `1.5px solid ${st.d ? "var(--color-accent)" : "var(--color-neutral-400)"}`, background: st.d ? "var(--color-accent)" : "transparent", display: "grid", placeItems: "center" }}>
                  {st.d && <Icon name="check" size={12} style={{ color: "var(--color-bg)" }} />}
                </span>
                <span style={{ textDecoration: st.d ? "line-through" : "none", color: st.d ? "var(--color-neutral-500)" : "var(--color-text)" }}>{st.t}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{ border: "2px solid var(--color-divider)", marginTop: 4 }}>
        <div style={{ background: "var(--color-neutral-900)", color: "var(--color-neutral-100)", padding: "11px 14px", display: "flex", alignItems: "center", gap: 9 }}>
          <Icon name="folder-git-2" /><span style={{ fontSize: 13, fontWeight: 600, fontFamily: "var(--font-heading)" }}>{L.proj_info}</span>
        </div>
        <div style={{ padding: 15 }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>{d.projectName}</div>
          {label("Tech stack")}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
            {(pr?.stack || []).map((tech) => (
              <Tag key={tech} cls="tag-neutral" style={{ fontFamily: "ui-monospace,Menlo,monospace", fontSize: 11 }}>{tech}</Tag>
            ))}
          </div>
          {label(L.arch_h, 5)}
          <p style={{ fontSize: 13, lineHeight: 1.65, color: "var(--color-neutral-800)", margin: "0 0 16px" }}>{pr?.arch}</p>
          {label("Repository", 5)}
          <div style={{ fontFamily: "ui-monospace,Menlo,monospace", fontSize: 12, color: "var(--color-accent-700)", marginBottom: 16, wordBreak: "break-all" }}>{pr?.repo}</div>
          {pr?.notes && (
            <>
              {label(L.notes_h, 5)}
              <p style={{ fontSize: 13, lineHeight: 1.65, color: "var(--color-neutral-800)", margin: 0 }}>{pr.notes}</p>
            </>
          )}
        </div>
      </div>
    </>
  );
}
