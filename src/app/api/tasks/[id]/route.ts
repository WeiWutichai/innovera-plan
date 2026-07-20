import { NextResponse } from "next/server";
import { getStore } from "@/server/store";
import type { Status } from "@/lib/types";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

/**
 * PATCH /api/tasks/:id — one discriminated task action. Keeping activity
 * logging on the server means the client never has to synthesise it.
 */
export async function PATCH(req: Request, { params }: Ctx) {
  const store = getStore();
  const { id } = params;
  const body = await req.json();
  const action = body?.action as string;

  let result: unknown = null;
  switch (action) {
    case "edit":
      result = store.editTask(id, body.input);
      break;
    case "setStatus":
      result = store.setStatus(id, body.status as Status);
      break;
    case "cycle":
      result = store.cycleStatus(id, body.dir as number);
      break;
    case "setAssignee":
      result = store.setAssignee(id, body.userId as string);
      break;
    case "logTime":
      result = store.logTime(id, body.minutes as number);
      break;
    case "toggleSub":
      result = store.toggleSub(id, body.index as number);
      break;
    case "toggleTag":
      result = store.toggleTag(id, body.tagId as string);
      break;
    default:
      return NextResponse.json({ error: "unknown action" }, { status: 400 });
  }

  if (!result) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(result);
}

// DELETE /api/tasks/:id
export async function DELETE(_req: Request, { params }: Ctx) {
  const result = getStore().deleteTask(params.id);
  if (!result) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(result);
}
