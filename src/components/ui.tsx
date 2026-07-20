"use client";

import type { CSSProperties, ReactNode } from "react";
import { Icon } from "./Icon";
import type { DecoratedTask } from "@/lib/domain";

export { Icon } from "./Icon";

// ── small atoms ──────────────────────────────────────────────────────────────

export function ProjectDot({ color, size = 8 }: { color: string; size?: number }) {
  return <span style={{ width: size, height: size, flex: "none", background: color, display: "inline-block" }} />;
}

export function Avatar({
  initials,
  bg,
  size = 30,
  font = 12,
}: {
  initials: string;
  bg: string;
  size?: number;
  font?: number;
}) {
  return (
    <span
      style={{
        width: size,
        height: size,
        flex: "none",
        background: bg,
        color: "var(--color-bg)",
        display: "grid",
        placeItems: "center",
        font: `800 ${font}px var(--font-heading)`,
      }}
    >
      {initials}
    </span>
  );
}

export function Tag({ cls, children, style }: { cls: string; children: ReactNode; style?: CSSProperties }) {
  return <span className={`tag ${cls}`} style={style}>{children}</span>;
}

export function CheckSquare({
  done,
  border,
  bg,
  onClick,
  size = 20,
  check = 13,
}: {
  done: boolean;
  border: string;
  bg: string;
  onClick?: (e: React.MouseEvent) => void;
  size?: number;
  check?: number;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: size,
        height: size,
        flex: "none",
        border: `1.5px solid ${border}`,
        background: bg,
        cursor: "pointer",
        display: "grid",
        placeItems: "center",
        padding: 0,
      }}
    >
      {done && <Icon name="check" size={check} style={{ color: "var(--color-bg)" }} />}
    </button>
  );
}

export function ProgressBar({
  pct,
  height = 8,
  track = "var(--color-neutral-200)",
  fill = "var(--color-accent)",
}: {
  pct: number;
  height?: number;
  track?: string;
  fill?: string;
}) {
  return (
    <div style={{ height, background: track }}>
      <div style={{ height: "100%", width: `${pct}%`, background: fill }} />
    </div>
  );
}

// ── task row (list / focus) ──────────────────────────────────────────────────

export function TaskRow({
  t,
  onOpen,
  onToggleDone,
  meta = false,
}: {
  t: DecoratedTask;
  onOpen: () => void;
  onToggleDone: (e: React.MouseEvent) => void;
  /** Show inline subtask count + tag chips (list view). */
  meta?: boolean;
}) {
  return (
    <div
      onClick={onOpen}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "11px 14px",
        border: "1px solid var(--color-divider)",
        background: "var(--color-bg)",
        cursor: "pointer",
      }}
    >
      <CheckSquare done={t.done} border={t.checkBorder} bg={t.checkBg} onClick={onToggleDone} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: t.titleColor,
            textDecoration: t.strike,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {t.title}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: meta ? 8 : 7, marginTop: meta ? 4 : 3, flexWrap: "wrap" }}>
          <ProjectDot color={t.projDot} />
          <span style={{ fontSize: 12, color: "var(--color-neutral-600)" }}>{t.projectName}</span>
          {meta && t.hasSubs && (
            <span style={{ fontSize: 12, color: "var(--color-neutral-600)" }}>· ☑ {t.subLabel}</span>
          )}
          {meta &&
            t.tagChips.map((tg) => (
              <Tag key={tg.id} cls="tag-neutral" style={{ fontSize: 10, padding: "1px 7px" }}>
                #{tg.label}
              </Tag>
            ))}
        </div>
      </div>
      <Tag cls={t.quadClass}>{t.quadLabel}</Tag>
      <Tag cls={t.dueClass} style={{ minWidth: 62, justifyContent: "center" }}>
        {t.dueLabel}
      </Tag>
    </div>
  );
}

// ── task card (kanban) ───────────────────────────────────────────────────────

export function TaskCard({
  t,
  onOpen,
  onPrev,
  onNext,
  onDragStart,
  onDragEnd,
  prevLabel,
  nextLabel,
}: {
  t: DecoratedTask;
  onOpen: () => void;
  onPrev: (e: React.MouseEvent) => void;
  onNext: (e: React.MouseEvent) => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: (e: React.DragEvent) => void;
  prevLabel: string;
  nextLabel: string;
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onOpen}
      style={{ border: "1px solid var(--color-divider)", background: "var(--color-bg)", padding: "10px 11px", cursor: "grab" }}
    >
      <div style={{ display: "flex", gap: 6, marginBottom: 8, alignItems: "center" }}>
        <Tag cls={t.quadClass}>{t.quadLabel}</Tag>
        <Tag cls={t.dueClass} style={{ marginLeft: "auto" }}>
          {t.dueLabel}
        </Tag>
      </div>
      <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.3, marginBottom: 8 }}>{t.title}</div>
      {t.hasTags && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
          {t.tagChips.map((tg) => (
            <Tag key={tg.id} cls="tag-neutral" style={{ fontSize: 10, padding: "1px 7px" }}>
              #{tg.label}
            </Tag>
          ))}
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <ProjectDot color={t.projDot} />
        <span
          style={{
            fontSize: 11.5,
            color: "var(--color-neutral-600)",
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {t.projectName}
        </span>
        <button onClick={onPrev} title={prevLabel} style={miniBtn}>
          <Icon name="chevron-left" size={14} />
        </button>
        <button onClick={onNext} title={nextLabel} style={miniBtn}>
          <Icon name="chevron-right" size={14} />
        </button>
      </div>
    </div>
  );
}

const miniBtn: CSSProperties = {
  border: "1px solid var(--color-divider)",
  background: "transparent",
  cursor: "pointer",
  width: 23,
  height: 23,
  display: "grid",
  placeItems: "center",
  padding: 0,
  color: "var(--color-text)",
};

// ── section heading (icon + title) ───────────────────────────────────────────

export function SectionHeading({ icon, children }: { icon: string; children: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
      <Icon name={icon} style={{ color: "var(--color-accent)" }} />
      <h3 style={{ margin: 0, fontSize: 17 }}>{children}</h3>
    </div>
  );
}
