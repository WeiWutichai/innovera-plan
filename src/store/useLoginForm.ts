"use client";

import { useState } from "react";
import { usePlanner } from "./planner";

/** Shared login-form state for the desktop and mobile login screens. */
export function useLoginForm() {
  const { L, actions } = usePlanner();
  const [email, setEmail] = useState("thanakorn@acme.co");
  const [password, setPassword] = useState("password");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError("");
    const r = await actions.login(email.trim(), password);
    if (!r.ok) {
      setError(L.lg_error);
      setSubmitting(false);
    }
    // on success the provider flips `authed` and unmounts this screen.
  };

  return { email, setEmail, password, setPassword, error, submitting, submit };
}
