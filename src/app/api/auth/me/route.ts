import { NextResponse } from "next/server";
import { currentUser, unauthorized } from "@/server/guard";

export const dynamic = "force-dynamic";

// GET /api/auth/me → the current user, or 401 (also enforces session-version
// revocation via currentUser).
export async function GET(req: Request) {
  const me = await currentUser(req);
  if (!me) return unauthorized();
  return NextResponse.json({ user: me });
}
