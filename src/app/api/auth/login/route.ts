import { NextResponse } from "next/server";
import { getStore } from "@/server/store";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/server/session";
import type { LoginInput } from "@/lib/types";

export const dynamic = "force-dynamic";

// POST /api/auth/login → verify credentials, set the session cookie.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Partial<LoginInput>;
  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";
  if (!email || !password) {
    return NextResponse.json({ error: "email and password required" }, { status: 400 });
  }

  const result = await getStore().verifyCredentials(email, password);
  if (!result) {
    return NextResponse.json({ error: "invalid credentials" }, { status: 401 });
  }

  const token = await createSessionToken(result.user.id, result.sessionVersion);
  const res = NextResponse.json({ user: result.user });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return res;
}
