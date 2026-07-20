"use client";

import { usePlanner } from "@/store/planner";
import { LangToggle } from "@/components/LangToggle";

export function MobileLogin() {
  const { L, actions } = usePlanner();
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 60, background: "var(--color-bg)", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: "none", height: "calc(env(safe-area-inset-top) + 44px)" }} />
      <div style={{ background: "var(--color-accent)", color: "#fff", padding: "26px 26px 32px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 23, letterSpacing: "-0.02em", flex: 1 }}>INNOVERA</div>
          <LangToggle height={32} pad={12} onAccent />
        </div>
        <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 42, lineHeight: 1.03, letterSpacing: "-0.02em", marginTop: 34 }}>INNOVERA<br />PLAN</div>
        <div style={{ height: 2, background: "rgba(255,255,255,.55)", margin: "22px 0 12px" }} />
        <div style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", opacity: 0.9 }}>Work Planner</div>
      </div>
      <div style={{ flex: 1, padding: "30px 26px", display: "flex", flexDirection: "column" }}>
        <h2 style={{ fontSize: 24, margin: "0 0 4px" }}>{L.lg_title}</h2>
        <p style={{ fontSize: 13, color: "var(--color-neutral-600)", margin: "0 0 24px" }}>{L.lg_sub}</p>
        <div className="field" style={{ marginBottom: 14 }}>
          <label>{L.lg_email}</label>
          <input className="input" type="email" defaultValue="thanakorn@acme.co" placeholder="name@acme.co" />
        </div>
        <div className="field" style={{ marginBottom: 24 }}>
          <label>{L.lg_pass}</label>
          <input className="input" type="password" defaultValue="password" />
        </div>
        <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", height: 48 }} onClick={actions.login}>{L.lg_signin}</button>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 11, color: "var(--color-neutral-500)", textAlign: "center", paddingTop: 20 }}>© 2026 Work Planner</div>
      </div>
    </div>
  );
}
