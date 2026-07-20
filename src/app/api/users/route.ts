import { NextResponse } from "next/server";
import { getStore, type InviteInput } from "@/server/store";
import { badRequest, currentUser, forbidden, readJson, unauthorized } from "@/server/guard";
import type { Role } from "@/lib/types";

export const dynamic = "force-dynamic";

const ROLES: Role[] = ["admin", "member", "viewer"];
const isRole = (v: unknown): v is Role => ROLES.includes(v as Role);

// POST /api/users → invite a user (admin only).
export async function POST(req: Request) {
  const me = await currentUser(req);
  if (!me) return unauthorized();
  if (me.role !== "admin") return forbidden();

  const body = await readJson<Partial<InviteInput>>(req);
  if (!body || typeof body.name !== "string" || !body.name.trim()) {
    return badRequest("name required");
  }
  if (!isRole(body.role)) return badRequest("invalid role");

  const result = await getStore().inviteUser(
    { name: body.name, email: typeof body.email === "string" ? body.email : "", role: body.role },
    me.id,
  );
  return NextResponse.json(result, { status: 201 });
}
