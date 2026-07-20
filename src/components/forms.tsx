"use client";

import { usePlanner } from "@/store/planner";
import { STATUS_ORDER, type Role } from "@/lib/types";
import { Icon } from "@/components/ui";

const ROLES: Role[] = ["admin", "member", "viewer"];

/** Add / Edit task form — title, fields and actions. Wrapped by the desktop
 *  dialog and the mobile bottom sheet. The mobile prototype omits the Status
 *  select and the "(Eisenhower)" label suffix. */
export function AddTaskFormBody({ variant = "desktop" }: { variant?: "desktop" | "mobile" }) {
  const { state, L, actions } = usePlanner();
  const isMobile = variant === "mobile";
  const f = state.form;
  const en = state.lang === "en";
  const editing = !!state.editId;
  const title = editing ? (en ? "Edit task" : "แก้ไขงาน") : L.add_task_new;
  const submitLabel = editing ? L.save : L.add_task;
  const submitIcon = editing ? "check" : "plus";

  const chk = (on: boolean, onClick: () => void, text: string) => (
    <div onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer", fontSize: 14 }}>
      <span style={{ width: 18, height: 18, border: `1.5px solid ${on ? "var(--color-accent)" : "var(--color-neutral-400)"}`, background: on ? "var(--color-accent)" : "transparent", display: "grid", placeItems: "center" }}>
        {on && <Icon name="check" size={12} style={{ color: "var(--color-bg)" }} />}
      </span>
      {text}
    </div>
  );

  return (
    <>
      <div className="dialog-title">{title}</div>

      <div className="field">
        <label>{L.f_title}</label>
        <input className="input" value={f.title} onChange={(e) => actions.setForm({ title: e.target.value })} placeholder={L.ph_task} />
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <div className="field" style={{ flex: 1 }}>
          <label>{L.f_project}</label>
          <select className="input" value={f.projectId} onChange={(e) => actions.setForm({ projectId: e.target.value })}>
            {state.projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label>{L.f_due}</label>
          <input className="input" type="date" value={f.due} onChange={(e) => actions.setForm({ due: e.target.value })} />
        </div>
      </div>

      {!isMobile && (
        <div className="field">
          <label>{L.status_h}</label>
          <select className="input" value={f.status} onChange={(e) => actions.setForm({ status: e.target.value as typeof f.status })}>
            {STATUS_ORDER.map((st) => (
              <option key={st} value={st}>{L.status[st]}</option>
            ))}
          </select>
        </div>
      )}

      <div className="field">
        <label>{L.f_priority}{isMobile ? "" : " (Eisenhower)"}</label>
        <div style={{ display: "flex", gap: 20, marginTop: 2 }}>
          {chk(f.urgent, () => actions.setForm({ urgent: !f.urgent }), L.urgent)}
          {chk(f.important, () => actions.setForm({ important: !f.important }), L.important)}
        </div>
      </div>

      <div className="field">
        <label>{L.tags_h}</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 2 }}>
          {state.tags.map((g) => {
            const on = f.tags.includes(g.id);
            return (
              <button
                key={g.id}
                onClick={() => actions.setForm({ tags: on ? f.tags.filter((x) => x !== g.id) : [...f.tags, g.id] })}
                style={{ padding: "5px 11px", border: `1px solid ${on ? "var(--color-accent)" : "var(--color-divider)"}`, background: on ? "var(--color-accent)" : "transparent", color: on ? "var(--color-bg)" : "var(--color-neutral-700)", cursor: "pointer", font: "600 11.5px var(--font-body)" }}
              >
                #{g.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="dialog-actions">
        <button className="btn btn-secondary" onClick={actions.closeAdd}>{L.cancel}</button>
        <button className="btn btn-primary" onClick={actions.submitAdd}><Icon name={submitIcon} /><span>{submitLabel}</span></button>
      </div>
    </>
  );
}

/** Invite user form. */
export function InviteFormBody() {
  const { state, L, actions } = usePlanner();
  const iv = state.invite;
  return (
    <>
      <div className="dialog-title">{L.invite_new}</div>
      <div className="field">
        <label>{L.f_name}</label>
        <input className="input" value={iv.name} onChange={(e) => actions.setInvite({ name: e.target.value })} placeholder={L.ph_name} />
      </div>
      <div className="field">
        <label>{L.f_email}</label>
        <input className="input" type="email" value={iv.email} onChange={(e) => actions.setInvite({ email: e.target.value })} placeholder="name@acme.co" />
      </div>
      <div className="field">
        <label>{L.f_role}</label>
        <select className="input" value={iv.role} onChange={(e) => actions.setInvite({ role: e.target.value as Role })}>
          {ROLES.map((r) => (
            <option key={r} value={r}>{L.role[r]}</option>
          ))}
        </select>
      </div>
      <div className="dialog-actions">
        <button className="btn btn-secondary" onClick={actions.closeInvite}>{L.cancel}</button>
        <button className="btn btn-primary" onClick={actions.submitInvite}><Icon name="send" /><span>{L.send_invite}</span></button>
      </div>
    </>
  );
}
