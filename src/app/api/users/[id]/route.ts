import { NextResponse } from "next/server";
import { getStore } from "@/server/store";
import type { Role, UserStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

// PATCH /api/users/:id — role / status / password-reset.
export async function PATCH(req: Request, { params }: Ctx) {
  const store = getStore();
  const { id } = params;
  const body = await req.json();
  const action = body?.action as string;

  let result: unknown = null;
  switch (action) {
    case "setRole":
      result = store.setRole(id, body.role as Role);
      break;
    case "setStatus":
      result = store.setUserStatus(id, body.status as UserStatus);
      break;
    case "resetPw":
      result = store.resetPassword(id);
      break;
    default:
      return NextResponse.json({ error: "unknown action" }, { status: 400 });
  }

  if (!result) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(result);
}

// DELETE /api/users/:id — remove a member; their tasks reassign to the owner.
export async function DELETE(_req: Request, { params }: Ctx) {
  const result = getStore().removeUser(params.id);
  if (!result) return NextResponse.json({ error: "cannot remove" }, { status: 400 });
  return NextResponse.json(result);
}
