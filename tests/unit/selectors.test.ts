import { describe, expect, it } from "vitest";
import {
  calendarDays,
  filteredTasks,
  kanbanCols,
  listGroups,
  overdueTasks,
  quadrants,
  stats,
  timeline,
  timeSummary,
  type SelectCtx,
} from "@/lib/selectors";
import { dict } from "@/lib/i18n";
import { SEED_PROJECTS, SEED_TAGS, SEED_TASKS, SEED_USERS } from "@/lib/seed";

function ctx(over: Partial<SelectCtx> = {}): SelectCtx {
  return {
    projects: SEED_PROJECTS,
    tasks: SEED_TASKS,
    users: SEED_USERS,
    tags: SEED_TAGS,
    L: dict("en"),
    lang: "en",
    filter: "all",
    tagFilter: null,
    assigneeFilter: null,
    ...over,
  };
}

describe("filteredTasks", () => {
  it("filters by project / tag / assignee", () => {
    expect(filteredTasks(ctx()).length).toBe(16);
    expect(filteredTasks(ctx({ filter: "p1" })).map((t) => t.id).sort()).toEqual(["t1", "t14", "t2", "t3", "t4"].sort());
    expect(filteredTasks(ctx({ tagFilter: "bug" })).map((t) => t.id).sort()).toEqual(["t10", "t4"].sort());
    expect(filteredTasks(ctx({ assigneeFilter: "u3" })).length).toBe(4);
  });
});

describe("stats (dashboard KPIs)", () => {
  it("open / overdue / due-7d / done", () => {
    const s = stats(ctx());
    expect(s.map((c) => c.value)).toEqual([14, 1, 7, 2]); // matches the seeded dashboard
    expect(s[1].color).toBe("var(--color-accent)"); // overdue highlighted
  });
});

describe("overdueTasks", () => {
  it("only the single seeded overdue task (t4)", () => {
    const o = overdueTasks(ctx());
    expect(o.length).toBe(1);
    expect(o[0].id).toBe("t4");
  });
});

describe("listGroups (due buckets)", () => {
  it("groups open tasks and appends a Done group", () => {
    const g = listGroups(ctx());
    const byKey = Object.fromEntries(g.map((x) => [x.key, x]));
    expect(byKey.overdue.tasks.map((t) => t.id)).toEqual(["t4"]);
    expect(byKey.today.count).toBe(2); // t13, t14
    expect(byKey.done.count).toBe(2); // t1, t9
  });
});

describe("kanbanCols", () => {
  it("five columns summing to every filtered task", () => {
    const cols = kanbanCols(ctx());
    expect(cols.map((c) => c.status)).toEqual(["Backlog", "To Do", "In Progress", "Review", "Done"]);
    expect(cols.reduce((n, c) => n + c.count, 0)).toBe(16);
    expect(cols.find((c) => c.status === "Done")!.count).toBe(2);
  });
});

describe("quadrants (matrix)", () => {
  it("classifies open tasks; counts sum to open total", () => {
    const q = quadrants(ctx());
    expect(q.map((x) => x.key)).toEqual(["do", "plan", "quick", "later"]);
    expect(q.reduce((n, x) => n + x.count, 0)).toBe(14); // open tasks
    expect(q.find((x) => x.key === "do")!.count).toBe(4); // t2,t4,t5,t13
  });
});

describe("calendarDays (July 2026)", () => {
  it("42 cells with today flagged", () => {
    const days = calendarDays(ctx());
    expect(days.length).toBe(42);
    const today = days.find((d) => d.iso === "2026-07-12")!;
    expect(today.isToday).toBe(true);
    expect(today.inMonth).toBe(true);
  });
});

describe("timeline (gantt)", () => {
  it("one row per project, 8 months, today marker in range", () => {
    const t = timeline(ctx());
    expect(t.rows.length).toBe(4);
    expect(t.months.length).toBe(8);
    expect(t.todayLeft).toBeGreaterThan(0);
    expect(t.todayLeft).toBeLessThan(100);
  });
});

describe("timeSummary (mobile time view)", () => {
  it("weekly totals from the week log", () => {
    const { weekBars, timeStats, projEffort } = timeSummary(ctx(), [6, 5.5, 7, 4.5, 6, 3, 2]);
    expect(weekBars.length).toBe(7);
    expect(weekBars[6].isToday).toBe(true);
    expect(timeStats[0].value).toBe("34 h"); // 6+5.5+7+4.5+6+3+2
    expect(projEffort.length).toBe(4);
  });
});
