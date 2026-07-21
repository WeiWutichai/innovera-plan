import { beforeEach, describe, expect, it } from "vitest";
import { getStore } from "@/server/store";
import { resetDb } from "../helpers";

const store = getStore();

beforeEach(async () => {
  await resetDb();
});

describe("verifyCredentials", () => {
  it("accepts an active user with the right password", async () => {
    const r = await store.verifyCredentials("thanakorn@acme.co", "password");
    expect(r?.user.id).toBe("u1");
    expect(r?.user.me).toBe(true);
    expect(typeof r?.sessionVersion).toBe("number");
  });

  it("rejects a wrong password", async () => {
    expect(await store.verifyCredentials("thanakorn@acme.co", "nope")).toBeNull();
  });

  it("rejects an invited (not-yet-active) account", async () => {
    // u4 (mintra) is seeded as invited
    expect(await store.verifyCredentials("mintra@acme.co", "password")).toBeNull();
  });

  it("rejects a disabled account", async () => {
    await store.setUserStatus("u2", "disabled", "u1");
    expect(await store.verifyCredentials("preeya@acme.co", "password")).toBeNull();
  });

  it("rejects an unknown email", async () => {
    expect(await store.verifyCredentials("ghost@acme.co", "password")).toBeNull();
  });
});

describe("resolveSession (revocation)", () => {
  it("accepts a matching session version, rejects a stale one", async () => {
    const login = await store.verifyCredentials("thanakorn@acme.co", "password");
    const sv = login!.sessionVersion;
    expect((await store.resolveSession("u1", sv))?.id).toBe("u1");

    await store.bumpSessionVersion("u1"); // e.g. logout
    expect(await store.resolveSession("u1", sv)).toBeNull();
  });

  it("rejects a disabled user's session", async () => {
    await store.setUserStatus("u2", "disabled", "u1"); // bumps version too
    expect(await store.resolveSession("u2", 0)).toBeNull();
  });
});

describe("changePassword", () => {
  it("requires the current password, updates it, and revokes old sessions", async () => {
    expect(await store.changePassword("u1", "wrong", "newpass12")).toMatchObject({ ok: false });

    const r = await store.changePassword("u1", "password", "newpass12");
    expect(r.ok).toBe(true);
    expect(r.sessionVersion).toBe(1); // bumped from 0

    // old password no longer works; new one does
    expect(await store.verifyCredentials("thanakorn@acme.co", "password")).toBeNull();
    expect((await store.verifyCredentials("thanakorn@acme.co", "newpass12"))?.user.id).toBe("u1");
    // sessions minted at v0 are now stale
    expect(await store.resolveSession("u1", 0)).toBeNull();
  });
});

describe("resetPassword", () => {
  it("invalidates the target's current credential", async () => {
    await store.resetPassword("u2", "u1");
    expect(await store.verifyCredentials("preeya@acme.co", "password")).toBeNull();
  });
});

describe("invite → accept", () => {
  it("issues a one-time token that activates and signs in the user", async () => {
    const inv = await store.inviteUser({ name: "New Person", email: "new@acme.co", role: "member" }, "u1");
    expect(inv.inviteToken).toHaveLength(64); // 32 bytes hex
    expect(inv.user.status).toBe("invited");

    // public lookup shows the invitee
    expect(await store.getInvite(inv.inviteToken)).toMatchObject({ name: "New Person", email: "new@acme.co" });

    // cannot log in before accepting
    expect(await store.verifyCredentials("new@acme.co", "whatever")).toBeNull();

    // accept sets the password + activates
    const accepted = await store.acceptInvite(inv.inviteToken, "mypassword1");
    expect(accepted?.user.status).toBe("active");
    expect(accepted?.user.me).toBe(true);

    // now they can log in with their chosen password
    expect((await store.verifyCredentials("new@acme.co", "mypassword1"))?.user.id).toBe(accepted?.user.id);

    // token is one-time — consumed
    expect(await store.getInvite(inv.inviteToken)).toBeNull();
    expect(await store.acceptInvite(inv.inviteToken, "another12")).toBeNull();
  });

  it("rejects an unknown token", async () => {
    expect(await store.getInvite("deadbeef")).toBeNull();
    expect(await store.acceptInvite("deadbeef", "password12")).toBeNull();
  });
});
