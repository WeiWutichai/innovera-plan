"use client";

import { usePlanner } from "@/store/planner";
import { useCtx } from "@/store/hooks";
import { overdueTasks } from "@/lib/selectors";
import { LangToggle } from "@/components/LangToggle";
import { Icon } from "@/components/ui";

const TITLE_KEYS = ["dashboard", "list", "kanban", "calendar", "timeline", "matrix", "team"] as const;

export function Header() {
  const { state, L, actions } = usePlanner();
  const ctx = useCtx();
  const overdue = overdueTasks(ctx);

  const isKnown = (TITLE_KEYS as readonly string[]).includes(state.view);
  const viewTitle = isKnown ? L.nav[state.view] : state.view === "activity" ? L.activity_h : L.nav[state.view];
  const viewSubtitle = isKnown ? L.sub[state.view] : state.view === "activity" ? L.activity_sub : L.sub[state.view];

  return (
    <header style={{ display: "flex", alignItems: "flex-end", gap: 16, padding: "20px 28px 18px", borderBottom: "2px solid var(--color-divider)", flex: "none" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h1 style={{ fontSize: 27, margin: 0, lineHeight: 1.1 }}>{viewTitle}</h1>
        <div style={{ fontSize: 13, color: "var(--color-neutral-600)", marginTop: 4 }}>{viewSubtitle}</div>
      </div>

      <LangToggle />

      <div style={{ position: "relative", flex: "none" }}>
        <button className="btn btn-secondary" onClick={actions.toggleNotif} title={L.overdue_title} style={{ position: "relative" }}>
          <Icon name="bell" />
          {overdue.length > 0 && (
            <span style={{ position: "absolute", top: -7, right: -7, minWidth: 19, height: 19, padding: "0 5px", background: "var(--color-accent)", color: "var(--color-bg)", font: "800 11px/19px var(--font-heading)", textAlign: "center", borderRadius: 10, border: "2px solid var(--color-bg)" }}>{overdue.length}</span>
          )}
        </button>
        {state.showNotif && (
          <>
            <div onClick={actions.closeNotif} style={{ position: "fixed", inset: 0, zIndex: 29 }} />
            <div style={{ position: "absolute", top: 44, right: 0, width: 320, zIndex: 30, background: "var(--color-bg)", border: "2px solid var(--color-divider)", boxShadow: "var(--shadow-lg)" }}>
              <div style={{ padding: "11px 14px", borderBottom: "2px solid var(--color-divider)", display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="alert-triangle" style={{ color: "var(--color-accent)" }} />
                <span style={{ font: "600 13px var(--font-heading)" }}>{L.overdue_title}</span>
                <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--color-neutral-600)" }}>{overdue.length}{L.unit_task}</span>
              </div>
              <div style={{ maxHeight: 320, overflow: "auto" }}>
                {overdue.map((t) => (
                  <div key={t.id} onClick={() => { actions.selectTask(t.id); actions.closeNotif(); }} style={{ padding: "11px 14px", borderBottom: "1px solid var(--color-divider)", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
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
        )}
      </div>

      <button className="btn btn-primary" onClick={() => actions.openAdd()}><Icon name="plus" /><span>{L.add_task}</span></button>
    </header>
  );
}
