"use client";

import { usePlanner } from "@/store/planner";
import { useCtx } from "@/store/hooks";
import { overdueTasks } from "@/lib/selectors";
import { LangToggle } from "@/components/LangToggle";
import { Icon } from "@/components/ui";

export function MobileHeader() {
  const { state, L, actions } = usePlanner();
  const ctx = useCtx();
  const overdue = overdueTasks(ctx);
  const todayShort = "12 " + L.mon[6] + " 2026";

  return (
    <header style={{ flex: "none", padding: "calc(env(safe-area-inset-top) + 16px) 18px 12px", borderBottom: "2px solid var(--color-divider)", display: "flex", alignItems: "flex-end", gap: 12 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-neutral-600)" }}>INNOVERA · {todayShort}</div>
        <h1 style={{ fontSize: 26, margin: "2px 0 0", lineHeight: 1.1 }}>{L.title[state.view]}</h1>
      </div>
      <LangToggle height={42} pad={10} />
      <button onClick={actions.toggleNotif} style={{ flex: "none", width: 42, height: 42, border: "1px solid var(--color-divider)", background: "transparent", cursor: "pointer", position: "relative", display: "grid", placeItems: "center", color: "var(--color-text)" }}>
        <Icon name="bell" size={22} />
        {overdue.length > 0 && (
          <span style={{ position: "absolute", top: -6, right: -6, minWidth: 19, height: 19, padding: "0 5px", background: "var(--color-accent)", color: "var(--color-bg)", font: "800 11px/19px var(--font-heading)", textAlign: "center", borderRadius: 10, border: "2px solid var(--color-bg)" }}>{overdue.length}</span>
        )}
      </button>
    </header>
  );
}
