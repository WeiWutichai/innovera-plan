import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/server/session";

// (Next 16 renamed the "middleware" convention to "proxy".)
// Guard every /api route except the auth endpoints. Unauthenticated requests
// get a 401 before they ever reach a handler, so the backend is genuinely
// protected — not just the UI.
export async function proxy(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }
  const userId = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (!userId) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
