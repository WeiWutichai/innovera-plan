"use client";

import { usePlanner } from "@/store/planner";
import { useCtx } from "@/store/hooks";
import { navCounts, projectFilterCounts } from "@/lib/selectors";
import { DESKTOP_VIEWS, type ViewKey } from "@/lib/types";
import { Icon } from "@/components/ui";

const NAV_ICON: Record<ViewKey, string> = {
  dashboard: "layout-dashboard",
  list: "list-checks",
  kanban: "columns-3",
  calendar: "calendar-days",
  timeline: "gantt-chart",
  matrix: "grid-2x2",
  team: "users",
  activity: "history",
  time: "clock",
};

export function Sidebar() {
  const { state, L, actions } = usePlanner();
  const ctx = useCtx();
  const counts = navCounts(ctx);
  const pfCounts = projectFilterCounts(ctx);

  const navCount = (k: ViewKey): number | string => {
    if (k === "list" || k === "kanban" || k === "matrix") return counts.openCount;
    if (k === "calendar") return counts.calMonthCount;
    if (k === "timeline") return counts.projectCount;
    return "";
  };

  const projectFilters = [
    { id: "all", name: L.all_tasks, dot: "var(--color-neutral-700)" },
    ...state.projects.map((p) => ({ id: p.id, name: p.name, dot: p.dot })),
  ];

  return (
    <aside style={{ width: 252, flex: "none", background: "var(--color-surface)", borderRight: "2px solid var(--color-divider)", display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      <div style={{ padding: "20px 18px 15px", borderBottom: "2px solid var(--color-divider)" }}>
        <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 20, letterSpacing: "-0.02em" }}>INNOVERA<span style={{ color: "var(--color-accent)" }}>.</span></div>
        <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-neutral-600)", marginTop: 3 }}>INNOVERA PLAN</div>
      </div>

      <nav style={{ padding: "10px 0 6px", display: "flex", flexDirection: "column", gap: 1 }}>
        {DESKTOP_VIEWS.map((k) => {
          const active = state.view === k;
          return (
            <button
              key={k}
              onClick={() => actions.setView(k)}
              aria-current={active ? "page" : undefined}
              style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 16px", border: 0, borderLeft: `3px solid ${active ? "var(--color-accent)" : "transparent"}`, cursor: "pointer", background: active ? "var(--color-accent-100)" : "transparent", color: active ? "var(--color-accent-700)" : "var(--color-text)", width: "100%", textAlign: "left", font: "600 14px/1.2 var(--font-body)" }}
            >
              <Icon name={NAV_ICON[k]} />
              <span style={{ flex: 1 }}>{L.nav[k]}</span>
              <span style={{ fontSize: 11, color: "var(--color-neutral-600)" }}>{navCount(k)}</span>
            </button>
          );
        })}
      </nav>

      <div style={{ padding: "12px 16px 6px", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-neutral-600)", borderTop: "2px solid var(--color-divider)", marginTop: 8 }}>{L.projects_h}</div>
      <div style={{ flex: 1, overflow: "auto", padding: "2px 0 12px" }}>
        {projectFilters.map((p) => {
          const active = state.filter === p.id;
          return (
            <button
              key={p.id}
              onClick={() => actions.setFilter(p.id)}
              aria-current={active ? "page" : undefined}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 16px", border: 0, cursor: "pointer", background: active ? "var(--color-accent-100)" : "transparent", width: "100%", textAlign: "left", font: "14px/1.3 var(--font-body)", color: "var(--color-text)" }}
            >
              <span style={{ width: 9, height: 9, flex: "none", background: p.dot }} />
              <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
              <span style={{ fontSize: 11, color: "var(--color-neutral-600)" }}>{pfCounts[p.id]}</span>
            </button>
          );
        })}
      </div>

      {/* Footer: date + sign-out. The sign-out control is not in the original
          design — it is a necessary addition for real authentication. */}
      <div style={{ padding: "13px 16px", borderTop: "2px solid var(--color-divider)", display: "flex", alignItems: "center", gap: 9, fontSize: 12, color: "var(--color-neutral-700)" }}>
        <Icon name="calendar-clock" /><span style={{ flex: 1 }}>{L.today_full}</span>
        <button className="btn btn-icon btn-secondary" title={L.logout} onClick={() => actions.logout()} style={{ width: 30, height: 30 }}>
          <Icon name="log-out" size={15} />
        </button>
      </div>
    </aside>
  );
}
