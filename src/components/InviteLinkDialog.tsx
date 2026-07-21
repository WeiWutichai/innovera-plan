"use client";

import { useState } from "react";
import { usePlanner } from "@/store/planner";
import { Icon } from "@/components/ui";

// Shown to the admin after a successful invite. Without email delivery, the
// admin copies this one-time link and sends it to the invitee.
export function InviteLinkDialog() {
  const { state, L, actions } = usePlanner();
  const [copied, setCopied] = useState(false);
  if (!state.inviteLink) return null;
  const link = state.inviteLink;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — the field is selectable as a fallback */
    }
  };
  const close = () => { setCopied(false); actions.clearInviteLink(); };

  return (
    <div className="dialog-backdrop" style={{ zIndex: 55 }} onClick={close}>
      <div className="dialog" onClick={(e) => e.stopPropagation()} style={{ width: "min(520px, 100%)" }}>
        <div className="dialog-title">{L.inv_link_title}</div>
        <div className="dialog-body">{L.inv_link_desc}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            className="input"
            readOnly
            value={link}
            onFocus={(e) => e.currentTarget.select()}
            style={{ flex: 1, fontFamily: "ui-monospace,Menlo,monospace", fontSize: 12 }}
          />
          <button className="btn btn-secondary" onClick={copy} style={{ flex: "none", whiteSpace: "nowrap" }}>
            <Icon name={copied ? "check" : "copy"} size={15} />
            <span>{copied ? L.inv_copied : L.inv_copy}</span>
          </button>
        </div>
        <div className="dialog-actions">
          <button className="btn btn-primary" onClick={close}>{L.done}</button>
        </div>
      </div>
    </div>
  );
}
