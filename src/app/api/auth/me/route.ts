import { NextResponse } from "next/server";
import { getStore } from "@/server/store";
import { getSessionUserId } from "@/server/session";

export const dynamic = "force-dynamic";

// GET /api/auth/me → the current user, or 401.
export async function GET(req: Request) {
  const userId = await getSessionUserId(req);
  if (!userId) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const user = await getStore().getUser(userId);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  return NextResponse.json({ user });
}
