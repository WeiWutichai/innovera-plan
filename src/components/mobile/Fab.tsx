"use client";

import { usePlanner } from "@/store/planner";
import { Icon } from "@/components/ui";

export function Fab() {
  const { actions } = usePlanner();
  return (
    <button
      onClick={() => actions.openAdd("To Do")}
      aria-label="add task"
      style={{
        position: "absolute", right: 18, bottom: "calc(env(safe-area-inset-bottom) + 84px)", zIndex: 20,
        width: 56, height: 56, background: "var(--color-accent)", color: "var(--color-bg)", border: 0,
        boxShadow: "var(--shadow-md)", cursor: "pointer", display: "grid", placeItems: "center",
      }}
    >
      <Icon name="plus" size={26} />
    </button>
  );
}
