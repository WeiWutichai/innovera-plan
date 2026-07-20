import { NextResponse } from "next/server";
import { getStore } from "@/server/store";
import { badRequest, currentUser, readJson, unauthorized } from "@/server/guard";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/server/session";
import { MIN_PASSWORD_LENGTH, type ChangePasswordInput } from "@/lib/types";

export const dynamic = "force-dynamic";

// POST /api/auth/change-password — the signed-in user changes their own password.
export async function POST(req: Request) {
  const me = await currentUser(req);
  if (!me) return unauthorized();

  const body = await readJson<Partial<ChangePasswordInput>>(req);
  const currentPassword = body?.currentPassword;
  const newPassword = body?.newPassword;
  if (typeof currentPassword !== "string" || typeof newPassword !== "string") {
    return badRequest("missing fields");
  }
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json({ error: "weak" }, { status: 400 });
  }

  const result = await getStore().changePassword(me.id, currentPassword, newPassword);
  if (!result.ok) {
    return NextResponse.json({ error: "wrong-current" }, { status: 400 });
  }

  // Bumping sessionVersion revoked all sessions (incl. this one); re-issue a
  // token at the new version so the current session stays signed in.
  const token = await createSessionToken(me.id, result.sessionVersion!);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return res;
}
