"use client";

import { usePlanner } from "@/store/planner";
import { InviteFormBody } from "@/components/forms";

export function InviteDialog() {
  const { state, actions } = usePlanner();
  if (!state.showInvite) return null;
  return (
    <div className="dialog-backdrop" style={{ zIndex: 50 }} onClick={actions.closeInvite}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <InviteFormBody />
      </div>
    </div>
  );
}
