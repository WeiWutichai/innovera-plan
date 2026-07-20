"use client";

import { usePlanner } from "@/store/planner";
import { decorate } from "@/lib/domain";
import { Icon, Tag } from "@/components/ui";
import { TaskDetailBody } from "@/components/TaskDetailBody";

export function TaskDrawer() {
  const { state, L, actions } = usePlanner();
  const raw = state.selId ? state.tasks.find((t) => t.id === state.selId) : null;
  if (!raw) return null;
  const d = decorate(raw, state.projects, state.tags, L);

  return (
    <>
      <div style={{ position: "fixed", inset: 0, zIndex: 40, background: "color-mix(in srgb,var(--color-neutral-900) 45%,transparent)" }} onClick={actions.closeTask} />
      <aside
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0, width: "min(486px,92vw)", zIndex: 41,
          background: "var(--color-bg)", borderLeft: "2px solid var(--color-divider)", boxShadow: "var(--shadow-lg)",
          display: "flex", flexDirection: "column", animation: "drawerIn .2s ease",
        }}
      >
        <div style={{ padding: "16px 20px", borderBottom: "2px solid var(--color-divider)", display: "flex", alignItems: "center", gap: 10, flex: "none" }}>
          <Tag cls={d.quadClass}>{d.quadLabel}</Tag>
          <span style={{ fontSize: 12, color: "var(--color-neutral-600)" }}>{d.statusLabel}</span>
          <button onClick={() => actions.openEdit(raw.id)} className="btn btn-icon btn-secondary" title={L.edit} style={{ marginLeft: "auto" }}><Icon name="pencil" /></button>
          <button onClick={() => actions.deleteTask(raw.id)} className="btn btn-icon btn-secondary" title={L.del}><Icon name="trash-2" /></button>
          <button onClick={actions.closeTask} className="btn btn-icon btn-secondary"><Icon name="x" /></button>
        </div>
        <div style={{ flex: 1, overflow: "auto", padding: 20 }}>
          <TaskDetailBody taskId={raw.id} />
        </div>
      </aside>
    </>
  );
}
