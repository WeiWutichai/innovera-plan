"use client";

import { usePlanner } from "@/store/planner";
import { useLoginForm } from "@/store/useLoginForm";
import { LangToggle } from "@/components/LangToggle";

export function LoginScreen() {
  const { L } = usePlanner();
  const f = useLoginForm();
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, background: "var(--color-bg)", display: "flex" }}>
      <div style={{ flex: 1, background: "var(--color-accent)", color: "var(--color-bg)", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "56px 52px" }}>
        <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 26, letterSpacing: "-0.02em" }}>INNOVERA</div>
        <div>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 58, lineHeight: 1.02, letterSpacing: "-0.02em" }}>INNOVERA<br />PLAN</div>
          <div style={{ height: 2, background: "rgba(255,255,255,.55)", margin: "26px 0 14px" }} />
          <div style={{ fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", opacity: 0.9 }}>Work Planner</div>
        </div>
      </div>
      <div style={{ width: 452, flex: "none", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 56px", position: "relative" }}>
        <div style={{ position: "absolute", top: 28, right: 56 }}>
          <LangToggle pad={12} />
        </div>
        <h2 style={{ fontSize: 30, margin: "0 0 4px" }}>{L.lg_title}</h2>
        <p style={{ fontSize: 14, color: "var(--color-neutral-600)", margin: "0 0 26px" }}>{L.lg_sub}</p>
        <form onSubmit={(e) => { e.preventDefault(); f.submit(); }}>
          <div className="field" style={{ marginBottom: 14 }}>
            <label>{L.lg_email}</label>
            <input className="input" type="email" value={f.email} onChange={(e) => f.setEmail(e.target.value)} placeholder="name@acme.co" />
          </div>
          <div className="field" style={{ marginBottom: f.error ? 12 : 26 }}>
            <label>{L.lg_pass}</label>
            <input className="input" type="password" value={f.password} onChange={(e) => f.setPassword(e.target.value)} />
          </div>
          {f.error && <div style={{ color: "var(--color-accent-700)", fontSize: 13, marginBottom: 18 }}>{f.error}</div>}
          <button type="submit" className="btn btn-primary" disabled={f.submitting} style={{ width: "100%", justifyContent: "center", height: 46 }}>{L.lg_signin}</button>
        </form>
      </div>
    </div>
  );
}
