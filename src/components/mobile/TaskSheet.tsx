"use client";

import { usePlanner } from "@/store/planner";
import { decorate } from "@/lib/domain";
import { Icon, Tag } from "@/components/ui";
import { TaskDetailBody } from "@/components/TaskDetailBody";

export function TaskSheet() {
  const { state, L, actions } = usePlanner();
  const raw = state.selId ? state.tasks.find((t) => t.id === state.selId) : null;
  if (!raw) return null;
  const d = decorate(raw, state.projects, state.tags, L);

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 44, background: "var(--color-bg)", display: "flex", flexDirection: "column", animation: "sheetUp .22s ease" }}>
      <div style={{ padding: "calc(env(safe-area-inset-top) + 12px) 16px 12px", borderBottom: "2px solid var(--color-divider)", display: "flex", alignItems: "center", gap: 10, flex: "none" }}>
        <Tag cls={d.quadClass}>{d.quadLabel}</Tag>
        <span style={{ fontSize: 12, color: "var(--color-neutral-600)" }}>{d.statusLabel}</span>
        <button onClick={() => actions.openEdit(raw.id)} className="btn btn-icon btn-secondary" title={L.edit} style={{ marginLeft: "auto" }}><Icon name="pencil" /></button>
        <button onClick={() => actions.deleteTask(raw.id)} className="btn btn-icon btn-secondary" title={L.del}><Icon name="trash-2" /></button>
        <button onClick={actions.closeTask} className="btn btn-icon btn-secondary"><Icon name="x" /></button>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: "16px 16px calc(env(safe-area-inset-bottom) + 24px)" }}>
        <TaskDetailBody taskId={raw.id} />
      </div>
    </div>
  );
}
