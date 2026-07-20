"use client";

import { usePlanner } from "@/store/planner";
import { Icon } from "@/components/ui";
import { MORE_TABS } from "./nav";

export function MoreSheet() {
  const { state, L, actions } = usePlanner();
  if (!state.showMore) return null;
  return (
    <>
      <div onClick={actions.closeMore} style={{ position: "absolute", inset: 0, zIndex: 46, background: "color-mix(in srgb,var(--color-neutral-900) 45%,transparent)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 47, background: "var(--color-surface)", borderTop: "2px solid var(--color-divider)", padding: "14px 14px calc(env(safe-area-inset-bottom) + 20px)", animation: "sheetUp .22s ease" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, background: "var(--color-divider)", border: "1px solid var(--color-divider)" }}>
          {MORE_TABS.map((t) => {
            const active = state.view === t.key;
            return (
              <button
                key={t.key}
                onClick={() => actions.setView(t.key)}
                style={{ display: "flex", alignItems: "center", gap: 11, padding: "14px 14px", border: 0, background: "var(--color-bg)", color: active ? "var(--color-accent)" : "var(--color-text)", cursor: "pointer", font: "600 15px var(--font-body)", textAlign: "left" }}
              >
                <Icon name={t.icon} size={20} />
                {L.tab[t.key]}
              </button>
            );
          })}
        </div>
        {/* Account controls are not in the original design — necessary for auth. */}
        <button
          onClick={() => { actions.closeMore(); actions.openChangePassword(); }}
          style={{ display: "flex", alignItems: "center", gap: 11, width: "100%", marginTop: 14, padding: "13px 14px", border: "1px solid var(--color-divider)", background: "var(--color-bg)", color: "var(--color-text)", cursor: "pointer", font: "600 15px var(--font-body)", textAlign: "left" }}
        >
          <Icon name="key-round" size={20} />
          {L.cp_title}
        </button>
        <button
          onClick={() => { actions.closeMore(); actions.logout(); }}
          style={{ display: "flex", alignItems: "center", gap: 11, width: "100%", marginTop: 8, padding: "13px 14px", border: "1px solid var(--color-divider)", background: "var(--color-bg)", color: "var(--color-text)", cursor: "pointer", font: "600 15px var(--font-body)", textAlign: "left" }}
        >
          <Icon name="log-out" size={20} />
          {L.logout}
        </button>
      </div>
    </>
  );
}
