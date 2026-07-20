"use client";

import { usePlanner } from "@/store/planner";
import { useCtx } from "@/store/hooks";
import { overdueTasks } from "@/lib/selectors";
import { Icon } from "@/components/ui";

export function NotifSheet() {
  const { state, L, actions } = usePlanner();
  const ctx = useCtx();
  if (!state.showNotif) return null;
  const overdue = overdueTasks(ctx);

  return (
    <>
      <div onClick={actions.closeNotif} style={{ position: "absolute", inset: 0, zIndex: 40, background: "color-mix(in srgb,var(--color-neutral-900) 45%,transparent)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 41, background: "var(--color-bg)", borderTop: "2px solid var(--color-divider)", maxHeight: "70%", display: "flex", flexDirection: "column", paddingBottom: "calc(env(safe-area-inset-bottom) + 6px)", animation: "sheetUp .22s ease" }}>
        <div style={{ padding: "13px 16px", borderBottom: "2px solid var(--color-divider)", display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name="alert-triangle" size={18} style={{ color: "var(--color-accent)" }} />
          <span style={{ font: "600 14px var(--font-heading)" }}>{L.overdue_title}</span>
          <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--color-neutral-600)" }}>{overdue.length}{L.unit_task}</span>
          <button onClick={actions.closeNotif} className="btn btn-icon btn-secondary" style={{ width: 30, height: 30 }}><Icon name="x" size={16} /></button>
        </div>
        <div style={{ overflow: "auto" }}>
          {overdue.map((t) => (
            <div key={t.id} onClick={() => { actions.selectTask(t.id); actions.closeNotif(); }} style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-divider)", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 8, height: 8, flex: "none", background: t.projDot }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</div>
                <div style={{ fontSize: 11, color: "var(--color-neutral-600)" }}>{t.projectName}</div>
              </div>
              <span className="tag tag-accent">{t.dueLabel}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
