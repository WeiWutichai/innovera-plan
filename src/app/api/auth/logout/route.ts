import { NextResponse } from "next/server";
import { SESSION_COOKIE, sessionCookieOptions } from "@/server/session";

export const dynamic = "force-dynamic";

// POST /api/auth/logout → clear the session cookie.
export async function POST(req: Request) {
  // CSRF hardening: only honor same-origin requests, so a cross-site page can't
  // force a victim's logout. (Modern browsers send Sec-Fetch-Site.)
  const site = req.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions(0), maxAge: 0 });
  return res;
}
