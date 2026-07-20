import { NextResponse } from "next/server";
import { getStore } from "@/server/store";
import { badRequest, currentUser, forbidden, readJson, unauthorized } from "@/server/guard";
import type { Role, UserStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const ROLES: Role[] = ["admin", "member", "viewer"];
const USER_STATUS: UserStatus[] = ["active", "invited", "disabled"];
const isRole = (v: unknown): v is Role => ROLES.includes(v as Role);
const isUserStatus = (v: unknown): v is UserStatus => USER_STATUS.includes(v as UserStatus);

// PATCH /api/users/:id — role / status / password-reset (admin only).
export async function PATCH(req: Request, { params }: Ctx) {
  const me = await currentUser(req);
  if (!me) return unauthorized();
  if (me.role !== "admin") return forbidden();
  const store = getStore();
  const { id } = await params;
  const body = await readJson<Record<string, unknown>>(req);
  if (!body) return badRequest("invalid body");

  let result: unknown = null;
  switch (body.action) {
    case "setRole":
      if (!isRole(body.role)) return badRequest("invalid role");
      result = await store.setRole(id, body.role, me.id);
      break;
    case "setStatus":
      if (!isUserStatus(body.status)) return badRequest("invalid status");
      result = await store.setUserStatus(id, body.status, me.id);
      break;
    case "resetPw":
      result = await store.resetPassword(id, me.id);
      break;
    default:
      return badRequest("unknown action");
  }

  if (!result) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(result);
}

// DELETE /api/users/:id — remove a member (admin only); tasks reassign to the actor.
export async function DELETE(req: Request, { params }: Ctx) {
  const me = await currentUser(req);
  if (!me) return unauthorized();
  if (me.role !== "admin") return forbidden();
  const { id } = await params;
  const result = await getStore().removeUser(id, me.id);
  if (!result) return NextResponse.json({ error: "cannot remove" }, { status: 400 });
  return NextResponse.json(result);
}
