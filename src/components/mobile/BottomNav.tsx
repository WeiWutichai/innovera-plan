"use client";

import { usePlanner } from "@/store/planner";
import { Icon } from "@/components/ui";
import { MORE_KEYS, PRIMARY_TABS } from "./nav";

export function BottomNav() {
  const { state, L, actions } = usePlanner();
  const moreActive = MORE_KEYS.includes(state.view);

  const cell = { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "9px 0 5px", border: 0, background: "transparent", cursor: "pointer" } as const;

  return (
    <nav style={{ display: "flex", borderTop: "2px solid var(--color-divider)", background: "var(--color-surface)", paddingBottom: "calc(env(safe-area-inset-bottom) + 6px)", flex: "none" }}>
      {PRIMARY_TABS.map((t) => {
        const active = state.view === t.key;
        const color = active ? "var(--color-accent)" : "var(--color-neutral-600)";
        return (
          <button key={t.key} onClick={() => actions.setView(t.key)} style={{ ...cell, color }}>
            <Icon name={t.icon} size={22} />
            <span style={{ fontSize: 10.5, fontWeight: 600 }}>{L.tab[t.key]}</span>
          </button>
        );
      })}
      <button onClick={actions.openMore} style={{ ...cell, color: moreActive ? "var(--color-accent)" : "var(--color-neutral-600)" }}>
        <Icon name="ellipsis" size={22} />
        <span style={{ fontSize: 10.5, fontWeight: 600 }}>{state.lang === "en" ? "More" : "เพิ่มเติม"}</span>
      </button>
    </nav>
  );
}
