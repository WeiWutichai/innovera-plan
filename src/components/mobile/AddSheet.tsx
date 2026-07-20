"use client";

import { usePlanner } from "@/store/planner";
import { AddTaskFormBody, InviteFormBody } from "@/components/forms";

const scrim = { position: "absolute", inset: 0, zIndex: 48, background: "color-mix(in srgb,var(--color-neutral-900) 45%,transparent)" } as const;
const sheet = {
  position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 49, background: "var(--color-surface)",
  borderTop: "2px solid var(--color-divider)", padding: "18px 16px calc(env(safe-area-inset-bottom) + 24px)",
  display: "flex", flexDirection: "column", gap: 13, maxHeight: "92%", overflowY: "auto", animation: "sheetUp .22s ease",
} as const;

export function AddSheet() {
  const { state, actions } = usePlanner();
  if (!state.showAdd) return null;
  return (
    <>
      <div style={scrim} onClick={actions.closeAdd} />
      <div style={sheet}>
        <AddTaskFormBody variant="mobile" />
      </div>
    </>
  );
}

export function InviteSheet() {
  const { state, actions } = usePlanner();
  if (!state.showInvite) return null;
  return (
    <>
      <div style={scrim} onClick={actions.closeInvite} />
      <div style={sheet}>
        <InviteFormBody />
      </div>
    </>
  );
}
