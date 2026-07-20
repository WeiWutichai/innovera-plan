"use client";

import { usePlanner } from "@/store/planner";
import { Icon } from "@/components/ui";

export function Toast() {
  const { state, actions } = usePlanner();
  if (!state.toast) return null;
  return (
    <div
      onClick={actions.clearToast}
      style={{
        position: "fixed", left: "50%", bottom: 26, transform: "translateX(-50%)", zIndex: 70,
        background: "var(--color-neutral-900)", color: "var(--color-neutral-100)", padding: "12px 18px",
        fontSize: 13, boxShadow: "var(--shadow-lg)", display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
      }}
    >
      <Icon name="check" size={16} style={{ color: "var(--color-accent)" }} />
      {state.toast}
    </div>
  );
}
