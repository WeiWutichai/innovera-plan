import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/server/session";

// (Next 16 renamed the "middleware" convention to "proxy".)
// Guard every /api route except the auth endpoints. Unauthenticated requests
// get a 401 before they ever reach a handler, so the backend is genuinely
// protected — not just the UI.
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // Auth endpoints are public; /api/test is the E2E reset helper (a no-op /
  // 404 unless E2E=1, so it is inert in production).
  if (pathname.startsWith("/api/auth") || pathname.startsWith("/api/test")) {
    return NextResponse.next();
  }
  // First-line check: valid signature + not expired. The authoritative
  // revocation check (session version, disabled account) runs in the Node route
  // handlers via server/guard.ts, where Prisma is available.
  const claims = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (!claims) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
