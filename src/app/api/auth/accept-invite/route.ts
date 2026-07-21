import { NextResponse } from "next/server";
import { getStore } from "@/server/store";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/server/session";
import { MIN_PASSWORD_LENGTH } from "@/lib/types";

export const dynamic = "force-dynamic";

// POST /api/auth/accept-invite { token, password } → set password, activate the
// account, and sign the user in.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { token?: unknown; password?: unknown };
  const token = typeof body.token === "string" ? body.token : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!token) return NextResponse.json({ error: "invalid" }, { status: 400 });
  if (password.length < MIN_PASSWORD_LENGTH) return NextResponse.json({ error: "weak" }, { status: 400 });

  const result = await getStore().acceptInvite(token, password);
  if (!result) return NextResponse.json({ error: "invalid or expired" }, { status: 400 });

  const jwt = await createSessionToken(result.user.id, result.sessionVersion);
  const res = NextResponse.json({ user: result.user });
  res.cookies.set(SESSION_COOKIE, jwt, sessionCookieOptions());
  return res;
}
