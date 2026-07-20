"use client";

import { usePlanner } from "@/store/planner";
import { initials } from "@/lib/domain";

export function MobileFilterBar() {
  const { state, L, actions } = usePlanner();
  const anyActive = !!(state.tagFilter || state.assigneeFilter);

  const rowStyle = { display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 } as const;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
      <div style={rowStyle} className="no-scrollbar">
        {state.tags.map((g) => {
          const on = state.tagFilter === g.id;
          return (
            <button key={g.id} onClick={() => actions.setTagFilter(on ? null : g.id)} style={{ flex: "none", padding: "5px 11px", border: `1px solid ${on ? "var(--color-accent)" : "var(--color-divider)"}`, background: on ? "var(--color-accent)" : "transparent", color: on ? "var(--color-bg)" : "var(--color-neutral-700)", cursor: "pointer", font: "600 11.5px var(--font-body)" }}>#{g.label}</button>
          );
        })}
      </div>
      <div style={rowStyle} className="no-scrollbar">
        {state.users.map((u) => {
          const on = state.assigneeFilter === u.id;
          return (
            <button key={u.id} onClick={() => actions.setAssigneeFilter(on ? null : u.id)} style={{ flex: "none", display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px 4px 4px", border: `1px solid ${on ? "var(--color-accent)" : "var(--color-divider)"}`, background: on ? "var(--color-accent-100)" : "transparent", color: on ? "var(--color-accent-700)" : "var(--color-text)", cursor: "pointer", font: "600 11.5px var(--font-body)" }}>
              <span style={{ width: 20, height: 20, flex: "none", background: u.me ? "var(--color-accent)" : "var(--color-neutral-700)", color: "var(--color-bg)", display: "grid", placeItems: "center", font: "800 10px var(--font-heading)" }}>{initials(u.name)}</span>
              {u.name}
            </button>
          );
        })}
        {anyActive && (
          <button className="btn btn-ghost" style={{ flex: "none" }} onClick={actions.clearFilters}>{L.clear}</button>
        )}
      </div>
    </div>
  );
}
