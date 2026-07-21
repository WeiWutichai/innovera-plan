import { beforeEach, describe, expect, it } from "vitest";
import { createSessionToken, SESSION_COOKIE } from "@/server/session";
import { GET as bootstrapGET } from "@/app/api/bootstrap/route";
import { POST as usersPOST } from "@/app/api/users/route";
import { PATCH as userPATCH } from "@/app/api/users/[id]/route";
import { POST as loginPOST } from "@/app/api/auth/login/route";
import { resetDb } from "../helpers";

const BASE = "http://test.local";

async function authedReq(userId: string, sv: number, path: string, init: RequestInit = {}) {
  const token = await createSessionToken(userId, sv);
  return new Request(BASE + path, {
    ...init,
    headers: { cookie: `${SESSION_COOKIE}=${token}`, "content-type": "application/json", ...(init.headers as Record<string, string>) },
  });
}
const json = (body: unknown) => JSON.stringify(body);

beforeEach(async () => {
  await resetDb();
});

describe("authentication gate", () => {
  it("bootstrap requires a session (401 without one)", async () => {
    const res = await bootstrapGET(new Request(BASE + "/api/bootstrap"));
    expect(res.status).toBe(401);
  });

  it("bootstrap works with a valid session", async () => {
    const res = await bootstrapGET(await authedReq("u1", 0, "/api/bootstrap"));
    expect(res.status).toBe(200);
  });
});

describe("login route", () => {
  it("sets a session cookie on valid credentials", async () => {
    const res = await loginPOST(new Request(BASE + "/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: json({ email: "thanakorn@acme.co", password: "password" }) }));
    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).toContain(SESSION_COOKIE);
  });

  it("401 on wrong credentials", async () => {
    const res = await loginPOST(new Request(BASE + "/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: json({ email: "thanakorn@acme.co", password: "nope" }) }));
    expect(res.status).toBe(401);
  });
});

describe("admin-only user management (authz)", () => {
  it("a member CANNOT invite (403) but an admin CAN (201)", async () => {
    const body = json({ name: "X", email: "x@acme.co", role: "member" });
    const memberRes = await usersPOST(await authedReq("u2", 0, "/api/users", { method: "POST", body }));
    expect(memberRes.status).toBe(403);

    const adminRes = await usersPOST(await authedReq("u1", 0, "/api/users", { method: "POST", body: json({ name: "Y", email: "y@acme.co", role: "member" }) }));
    expect(adminRes.status).toBe(201);
  });

  it("a member CANNOT change roles (403); an admin CAN (200)", async () => {
    const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
    const memberRes = await userPATCH(await authedReq("u2", 0, "/api/users/u2", { method: "PATCH", body: json({ action: "setRole", role: "admin" }) }), ctx("u2"));
    expect(memberRes.status).toBe(403);

    const adminRes = await userPATCH(await authedReq("u1", 0, "/api/users/u3", { method: "PATCH", body: json({ action: "setRole", role: "member" }) }), ctx("u3"));
    expect(adminRes.status).toBe(200);
  });

  it("rejects an invalid role from an admin (400)", async () => {
    const res = await userPATCH(await authedReq("u1", 0, "/api/users/u3", { method: "PATCH", body: json({ action: "setRole", role: "superadmin" }) }), { params: Promise.resolve({ id: "u3" }) });
    expect(res.status).toBe(400);
  });
});
