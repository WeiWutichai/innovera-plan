import { describe, expect, it } from "vitest";
import {
  activityText,
  decorate,
  dueInfo,
  fmtHours,
  initials,
  quad,
  relTime,
  STATUS_DOT,
} from "@/lib/domain";
import { dict } from "@/lib/i18n";
import { SEED_PROJECTS, SEED_TAGS, SEED_TASKS } from "@/lib/seed";
import type { Task } from "@/lib/types";

const en = dict("en");
const task = (over: Partial<Task>): Task => ({
  id: "x", p: "p1", title: "t", status: "To Do", imp: false, urg: false,
  due: null, est: 0, spent: 0, desc: "", subs: [], tags: [], assignee: "u1", ...over,
});

describe("quad (Eisenhower)", () => {
  it("maps importance × urgency to the right quadrant", () => {
    expect(quad({ imp: true, urg: true }, en)).toMatchObject({ key: "do", cls: "tag-accent" });
    expect(quad({ imp: true, urg: false }, en)).toMatchObject({ key: "plan", cls: "tag-neutral" });
    expect(quad({ imp: false, urg: true }, en)).toMatchObject({ key: "quick", cls: "tag-accent-2" });
    expect(quad({ imp: false, urg: false }, en)).toMatchObject({ key: "later", cls: "tag-neutral" });
  });
});

describe("dueInfo", () => {
  it("Done tasks read as done regardless of date", () => {
    expect(dueInfo(task({ status: "Done", due: "2026-01-01" }), en)).toMatchObject({ tone: "done", label: en.d_done });
  });
  it("no due date", () => {
    expect(dueInfo(task({ due: null }), en)).toMatchObject({ tone: "none" });
  });
  it("overdue / today / tomorrow / soon / normal", () => {
    expect(dueInfo(task({ due: "2026-07-11" }), en)).toMatchObject({ tone: "overdue", cls: "tag-accent", label: "1d overdue" });
    expect(dueInfo(task({ due: "2026-07-12" }), en)).toMatchObject({ tone: "today", cls: "tag-outline" });
    expect(dueInfo(task({ due: "2026-07-13" }), en)).toMatchObject({ tone: "soon", label: en.d_tomorrow });
    expect(dueInfo(task({ due: "2026-07-18" }), en)).toMatchObject({ tone: "soon", label: "in 6d" });
    expect(dueInfo(task({ due: "2026-09-30" }), en)).toMatchObject({ tone: "normal" });
  });
});

describe("decorate", () => {
  it("builds a view model from a task (subtask progress, tags, project)", () => {
    const t2 = SEED_TASKS.find((t) => t.id === "t2")!; // 2/4 subtasks done
    const d = decorate(t2, SEED_PROJECTS, SEED_TAGS, en);
    expect(d.projectName).toBe("Payment Gateway v2");
    expect(d.hasSubs).toBe(true);
    expect(d.subLabel).toBe("2/4");
    expect(d.pct).toBe(50);
    expect(d.quadKey).toBe("do"); // imp + urg
    expect(d.tagChips.map((c) => c.id)).toContain("feature");
  });
  it("done task shows strike + 100% when it had subtasks or is complete", () => {
    const t1 = SEED_TASKS.find((t) => t.id === "t1")!; // Done, no subs
    const d = decorate(t1, SEED_PROJECTS, SEED_TAGS, en);
    expect(d.done).toBe(true);
    expect(d.strike).toBe("line-through");
    expect(d.pct).toBe(100);
  });
});

describe("misc helpers", () => {
  it("initials", () => {
    expect(initials("ธนกร ศ.")).toBe("ธศ");
    expect(initials("John Doe")).toBe("JD");
  });
  it("fmtHours", () => {
    expect(fmtHours(6, "en")).toBe("6 h");
    expect(fmtHours(6, "th")).toBe("6 ชม");
    expect(fmtHours(0.75, "th")).toBe("45 น");
    expect(fmtHours(0.5, "en")).toBe("30m");
  });
  it("STATUS_DOT covers every status", () => {
    expect(Object.keys(STATUS_DOT)).toEqual(["Backlog", "To Do", "In Progress", "Review", "Done"]);
  });
  it("relTime", () => {
    const now = 1_000_000_000_000;
    expect(relTime(now - 30_000, now, "en")).toBe("just now");
    expect(relTime(now - 5 * 60_000, now, "en")).toBe("5m ago");
    expect(relTime(now - 3 * 3_600_000, now, "en")).toBe("3h ago");
    expect(relTime(now - 2 * 86_400_000, now, "en")).toBe("2d ago");
  });
  it("activityText phrases events", () => {
    expect(activityText({ actor: "u1", type: "add", ts: 0, title: "X" }, en, "en")).toContain("added task");
    expect(activityText({ actor: "u1", type: "status", ts: 0, title: "X", status: "Done" }, en, "en")).toContain("→ Done");
  });
});
