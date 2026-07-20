"use client";

import { useState } from "react";
import { usePlanner } from "@/store/planner";
import { MIN_PASSWORD_LENGTH } from "@/lib/types";

// Not part of the original design — a necessary addition for real auth, so the
// signed-in user can rotate their own password.
export function ChangePasswordDialog() {
  const { state, L, actions } = usePlanner();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!state.showChangePassword) return null;

  const reset = () => { setCurrent(""); setNext(""); setConfirm(""); setError(""); setSubmitting(false); };
  const close = () => { reset(); actions.closeChangePassword(); };

  const submit = async () => {
    if (submitting) return;
    setError("");
    if (next.length < MIN_PASSWORD_LENGTH) { setError(L.cp_err_short); return; }
    if (next !== confirm) { setError(L.cp_err_mismatch); return; }
    setSubmitting(true);
    const r = await actions.changePassword(current, next);
    if (!r.ok) {
      setError(r.error === "weak" ? L.cp_err_short : L.cp_err_current);
      setSubmitting(false);
      return;
    }
    reset(); // success — the action already closed the dialog + toasted
  };

  return (
    <div className="dialog-backdrop" style={{ zIndex: 55 }} onClick={close}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-title">{L.cp_title}</div>
        <form onSubmit={(e) => { e.preventDefault(); submit(); }}>
          <div className="field" style={{ marginBottom: 12 }}>
            <label>{L.cp_current}</label>
            <input className="input" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" />
          </div>
          <div className="field" style={{ marginBottom: 12 }}>
            <label>{L.cp_new}</label>
            <input className="input" type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" />
          </div>
          <div className="field" style={{ marginBottom: error ? 12 : 0 }}>
            <label>{L.cp_confirm}</label>
            <input className="input" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
          </div>
          {error && <div style={{ color: "var(--color-accent-700)", fontSize: 13 }}>{error}</div>}
          <div className="dialog-actions">
            <button type="button" className="btn btn-secondary" onClick={close}>{L.cancel}</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>{L.cp_submit}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
