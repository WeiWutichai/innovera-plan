import { NextResponse } from "next/server";
import { getStore } from "@/server/store";

export const dynamic = "force-dynamic";

// GET /api/auth/invite?token=... → the pending invitee (name/email) or 404.
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token") || "";
  if (!token) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const invite = await getStore().getInvite(token);
  if (!invite) return NextResponse.json({ error: "invalid or expired" }, { status: 404 });
  return NextResponse.json({ invite });
}
