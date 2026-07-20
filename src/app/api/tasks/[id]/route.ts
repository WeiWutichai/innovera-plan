import { NextResponse } from "next/server";
import { getStore } from "@/server/store";
import type { Status } from "@/lib/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/**
 * PATCH /api/tasks/:id — one discriminated task action. Keeping activity
 * logging on the server means the client never has to synthesise it.
 */
export async function PATCH(req: Request, { params }: Ctx) {
  const store = getStore();
  const { id } = await params;
  const body = await req.json();
  const action = body?.action as string;

  let result: unknown = null;
  switch (action) {
    case "edit":
      result = await store.editTask(id, body.input);
      break;
    case "setStatus":
      result = await store.setStatus(id, body.status as Status);
      break;
    case "cycle":
      result = await store.cycleStatus(id, body.dir as number);
      break;
    case "setAssignee":
      result = await store.setAssignee(id, body.userId as string);
      break;
    case "logTime":
      result = await store.logTime(id, body.minutes as number);
      break;
    case "toggleSub":
      result = await store.toggleSub(id, body.index as number);
      break;
    case "toggleTag":
      result = await store.toggleTag(id, body.tagId as string);
      break;
    default:
      return NextResponse.json({ error: "unknown action" }, { status: 400 });
  }

  if (!result) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(result);
}

// DELETE /api/tasks/:id
export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const result = await getStore().deleteTask(id);
  if (!result) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(result);
}
