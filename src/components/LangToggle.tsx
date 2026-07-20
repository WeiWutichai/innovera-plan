"use client";

import { usePlanner } from "@/store/planner";

/** TH / EN segmented toggle, reused by the header and login screens.
 *  `onAccent` styles it for placement on the red hero (white borders). */
export function LangToggle({
  height = 34,
  pad = 11,
  onAccent = false,
}: {
  height?: number;
  pad?: number;
  onAccent?: boolean;
}) {
  const { state, actions } = usePlanner();
  const th = state.lang === "th";

  const borderColor = onAccent ? "rgba(255,255,255,.5)" : "var(--color-divider)";
  const activeBg = onAccent ? "#fff" : "var(--color-accent)";
  const activeColor = onAccent ? "var(--color-accent)" : "var(--color-bg)";
  const idleColor = onAccent ? "#fff" : "var(--color-text)";
  const base = { padding: `0 ${pad}px`, border: 0, cursor: "pointer", font: "700 12px var(--font-heading)" } as const;

  return (
    <div style={{ display: "flex", flex: "none", border: `1px solid ${borderColor}`, overflow: "hidden", height }}>
      <button
        onClick={() => actions.setLang("th")}
        style={{ ...base, background: th ? activeBg : "transparent", color: th ? activeColor : idleColor }}
      >
        TH
      </button>
      <button
        onClick={() => actions.setLang("en")}
        style={{ ...base, borderLeft: `1px solid ${borderColor}`, background: !th ? activeBg : "transparent", color: !th ? activeColor : idleColor }}
      >
        EN
      </button>
    </div>
  );
}
