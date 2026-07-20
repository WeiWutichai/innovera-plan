"use client";

import { usePlanner } from "@/store/planner";
import { AddTaskFormBody } from "@/components/forms";

export function AddTaskDialog() {
  const { state, actions } = usePlanner();
  if (!state.showAdd) return null;
  return (
    <div className="dialog-backdrop" style={{ zIndex: 50 }} onClick={actions.closeAdd}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <AddTaskFormBody />
      </div>
    </div>
  );
}
