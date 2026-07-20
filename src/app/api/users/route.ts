import { NextResponse } from "next/server";
import { getStore, type InviteInput } from "@/server/store";

export const dynamic = "force-dynamic";

// POST /api/users → invite a user.
export async function POST(req: Request) {
  const body = (await req.json()) as InviteInput;
  if (!body?.name || !body.name.trim()) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }
  const result = getStore().inviteUser(body);
  return NextResponse.json(result, { status: 201 });
}
