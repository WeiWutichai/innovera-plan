import { NextResponse } from "next/server";
import { getStore } from "@/server/store";
import { getSessionClaims, SESSION_COOKIE, sessionCookieOptions } from "@/server/session";

export const dynamic = "force-dynamic";

// POST /api/auth/logout → clear the cookie AND revoke the token server-side by
// bumping the user's session version (so a captured token can't be reused).
export async function POST(req: Request) {
  // CSRF hardening: only honor same-origin requests, so a cross-site page can't
  // force a victim's logout. (Modern browsers send Sec-Fetch-Site.)
  const site = req.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const claims = await getSessionClaims(req);
  if (claims) await getStore().bumpSessionVersion(claims.userId);

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions(0), maxAge: 0 });
  return res;
}
