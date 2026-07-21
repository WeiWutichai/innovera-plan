"use client";

import { useEffect, useState } from "react";
import { usePlanner } from "@/store/planner";
import { api } from "@/lib/api";
import { MIN_PASSWORD_LENGTH } from "@/lib/types";
import { LangToggle } from "@/components/LangToggle";

type State = "loading" | "invalid" | "ready";

export default function AcceptInvitePage() {
  const { L } = usePlanner();
  const [token, setToken] = useState("");
  const [state, setState] = useState<State>("loading");
  const [invite, setInvite] = useState<{ name: string; email: string } | null>(null);
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Read the token client-side (avoids a useSearchParams Suspense boundary).
    const t = new URLSearchParams(window.location.search).get("token") || "";
    setToken(t);
    if (!t) { setState("invalid"); return; }
    api.auth
      .getInvite(t)
      .then((inv) => { if (inv) { setInvite(inv); setState("ready"); } else setState("invalid"); })
      .catch(() => setState("invalid"));
  }, []);

  const submit = async () => {
    if (submitting) return;
    setError("");
    if (pw.length < MIN_PASSWORD_LENGTH) { setError(L.cp_err_short); return; }
    if (pw !== confirm) { setError(L.cp_err_mismatch); return; }
    setSubmitting(true);
    const r = await api.auth.acceptInvite(token, pw);
    if (!r.ok) {
      setError(r.error === "weak" ? L.cp_err_short : L.acc_invalid);
      setSubmitting(false);
      return;
    }
    // Now signed in — full navigation so the provider re-hydrates the session.
    window.location.href = "/";
  };

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--color-bg)", color: "var(--color-text)", fontFamily: "var(--font-body)" }}>
      <div style={{ background: "var(--color-accent)", color: "#fff", padding: "26px 26px 30px", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 22, letterSpacing: "-0.02em", flex: 1 }}>INNOVERA</div>
          <LangToggle height={34} pad={12} onAccent />
        </div>
        <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 34, lineHeight: 1.05, letterSpacing: "-0.02em" }}>INNOVERA PLAN</div>
        <div style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", opacity: 0.9 }}>Work Planner</div>
      </div>

      <div style={{ flex: 1, display: "grid", placeItems: "center", padding: 24 }}>
        <div style={{ width: "min(420px, 100%)" }}>
          {state === "loading" && (
            <div style={{ fontSize: 14, color: "var(--color-neutral-600)", textAlign: "center" }}>{L.acc_loading}</div>
          )}

          {state === "invalid" && (
            <div style={{ border: "1px solid var(--color-divider)", background: "var(--color-surface)", padding: 20 }}>
              <h2 style={{ fontSize: 20, margin: "0 0 8px" }}>{L.acc_title}</h2>
              <p style={{ fontSize: 14, color: "var(--color-accent-700)", margin: 0 }}>{L.acc_invalid}</p>
              <a href="/" className="btn btn-secondary" style={{ marginTop: 16 }}>{L.lg_signin}</a>
            </div>
          )}

          {state === "ready" && invite && (
            <form onSubmit={(e) => { e.preventDefault(); submit(); }}>
              <h2 style={{ fontSize: 24, margin: "0 0 4px" }}>{L.acc_title}</h2>
              <p style={{ fontSize: 14, color: "var(--color-neutral-600)", margin: "0 0 4px" }}>{L.acc_desc}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 9, margin: "10px 0 22px" }}>
                <span style={{ width: 30, height: 30, flex: "none", background: "var(--color-neutral-700)", color: "var(--color-bg)", display: "grid", placeItems: "center", font: "800 12px var(--font-heading)" }}>
                  {(invite.name || "").split(" ").map((w) => w[0] || "").join("").slice(0, 2)}
                </span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{invite.name}</div>
                  <div style={{ fontSize: 12, color: "var(--color-neutral-600)" }}>{invite.email}</div>
                </div>
              </div>
              <div className="field" style={{ marginBottom: 14 }}>
                <label>{L.cp_new}</label>
                <input className="input" type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" />
              </div>
              <div className="field" style={{ marginBottom: error ? 12 : 24 }}>
                <label>{L.cp_confirm}</label>
                <input className="input" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
              </div>
              {error && <div style={{ color: "var(--color-accent-700)", fontSize: 13, marginBottom: 16 }}>{error}</div>}
              <button type="submit" className="btn btn-primary" disabled={submitting} style={{ width: "100%", justifyContent: "center", height: 46 }}>{L.acc_submit}</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
