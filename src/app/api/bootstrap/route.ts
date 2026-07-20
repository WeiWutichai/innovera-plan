import { NextResponse } from "next/server";
import { getStore } from "@/server/store";
import { currentUser, unauthorized } from "@/server/guard";

export const dynamic = "force-dynamic";

// GET /api/bootstrap → the full dataset the client hydrates from.
export async function GET(req: Request) {
  const me = await currentUser(req);
  if (!me) return unauthorized();
  return NextResponse.json(await getStore().bootstrap(me.id));
}
