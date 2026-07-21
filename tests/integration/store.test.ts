import { beforeEach, describe, expect, it } from "vitest";
import { getStore } from "@/server/store";
import { resetDb } from "../helpers";

const store = getStore();
const ADMIN = "u1";

beforeEach(async () => {
  await resetDb();
});

describe("task mutations", () => {
  it("createTask assigns to the actor and logs an 'add' activity", async () => {
    const { task, activity } = await store.createTask(
      { title: "  new task  ", projectId: "p2", due: "2026-08-01", status: "To Do", urgent: true, important: false, tags: ["bug"] },
      ADMIN,
    );
    expect(task.title).toBe("new task"); // trimmed
    expect(task.assignee).toBe(ADMIN);
    expect(task.tags).toEqual(["bug"]);
    expect(activity).toMatchObject({ type: "add", actor: ADMIN, title: "new task" });
    const boot = await store.bootstrap(ADMIN);
    expect(boot.tasks.length).toBe(17);
  });

  it("setStatus logs, but cycleStatus does NOT (kanban chevron is silent)", async () => {
    const before = (await store.bootstrap(ADMIN)).activity.length;
    await store.setStatus("t3", "In Progress", ADMIN);
    const afterSet = (await store.bootstrap(ADMIN)).activity.length;
    expect(afterSet).toBe(before + 1);

    const cyc = await store.cycleStatus("t3", 1);
    expect(cyc?.task.status).toBe("Review");
    const afterCycle = (await store.bootstrap(ADMIN)).activity.length;
    expect(afterCycle).toBe(afterSet); // no new activity
  });

  it("toggleSub / toggleTag", async () => {
    const sub = await store.toggleSub("t2", 2); // was false
    expect(sub?.task.subs[2].d).toBe(true);
    const tagOn = await store.toggleTag("t3", "bug");
    expect(tagOn?.task.tags).toContain("bug");
    const tagOff = await store.toggleTag("t3", "bug");
    expect(tagOff?.task.tags).not.toContain("bug");
  });

  it("logTime accumulates spent and logs the amount", async () => {
    const r = await store.logTime("t3", 90, ADMIN); // 0 -> 1.5h
    expect(r?.task.spent).toBe(1.5);
    expect(r?.activity).toMatchObject({ type: "time", amount: "1.5h" });
  });

  it("deleteTask removes the task and logs 'del'", async () => {
    const r = await store.deleteTask("t7", ADMIN);
    expect(r?.removedId).toBe("t7");
    expect(r?.activity.type).toBe("del");
    const boot = await store.bootstrap(ADMIN);
    expect(boot.tasks.find((t) => t.id === "t7")).toBeUndefined();
    expect(boot.tasks.length).toBe(15);
  });

  it("setAssignee logs 'assign' with the target user's name", async () => {
    const r = await store.setAssignee("t1", "u2", ADMIN);
    expect(r?.task.assignee).toBe("u2");
    expect(r?.activity).toMatchObject({ type: "assign", name: "ปรียา ว." });
  });
});

describe("bootstrap", () => {
  it("marks the current user as 'me' and returns seeded counts", async () => {
    const boot = await store.bootstrap("u2");
    expect(boot.projects.length).toBe(4);
    expect(boot.tasks.length).toBe(16);
    expect(boot.users.length).toBe(4);
    expect(boot.users.find((u) => u.id === "u2")!.me).toBe(true);
    expect(boot.users.find((u) => u.id === "u1")!.me).toBeUndefined();
  });

  it("never leaks a password field", async () => {
    const boot = await store.bootstrap("u1");
    for (const u of boot.users) expect((u as unknown as Record<string, unknown>).password).toBeUndefined();
  });
});

describe("removeUser", () => {
  it("reassigns the removed user's tasks to the actor", async () => {
    const r = await store.removeUser("u3", ADMIN);
    expect(r?.removedId).toBe("u3");
    expect(r!.reassigned.length).toBeGreaterThan(0);
    for (const t of r!.reassigned) expect(t.assignee).toBe(ADMIN);
    const boot = await store.bootstrap(ADMIN);
    expect(boot.users.find((u) => u.id === "u3")).toBeUndefined();
    expect(boot.tasks.some((t) => t.assignee === "u3")).toBe(false);
  });

  it("cannot remove yourself", async () => {
    expect(await store.removeUser(ADMIN, ADMIN)).toBeNull();
  });
});
