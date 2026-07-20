import { NextResponse } from "next/server";
import { getStore } from "@/server/store";
import { badRequest, currentUser, readJson, unauthorized } from "@/server/guard";
import { STATUS_ORDER, type Status } from "@/lib/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const isStatus = (v: unknown): v is Status => STATUS_ORDER.includes(v as never);
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const isStr = (v: unknown): v is string => typeof v === "string";

/**
 * PATCH /api/tasks/:id — one discriminated task action. The actor comes from
 * the verified session (never the body), so a client cannot spoof who acted.
 */
export async function PATCH(req: Request, { params }: Ctx) {
  const me = await currentUser(req);
  if (!me) return unauthorized();
  const store = getStore();
  const { id } = await params;
  const body = await readJson<Record<string, unknown>>(req);
  if (!body) return badRequest("invalid body");
  const action = body.action;

  let result: unknown = null;
  switch (action) {
    case "edit": {
      const i = body.input as Record<string, unknown> | undefined;
      if (!i || !isStr(i.title) || !i.title.trim() || !isStr(i.projectId) || !isStatus(i.status)) {
        return badRequest("invalid edit input");
      }
      result = await store.editTask(id, {
        title: i.title,
        projectId: i.projectId,
        due: isStr(i.due) ? i.due : null,
        status: i.status,
        urgent: !!i.urgent,
        important: !!i.important,
        tags: Array.isArray(i.tags) ? i.tags.filter(isStr) : [],
      }, me.id);
      break;
    }
    case "setStatus":
      if (!isStatus(body.status)) return badRequest("invalid status");
      result = await store.setStatus(id, body.status, me.id);
      break;
    case "cycle":
      if (!isNum(body.dir)) return badRequest("invalid dir");
      result = await store.cycleStatus(id, body.dir);
      break;
    case "setAssignee":
      if (!isStr(body.userId)) return badRequest("invalid userId");
      result = await store.setAssignee(id, body.userId, me.id);
      break;
    case "logTime":
      if (!isNum(body.minutes) || body.minutes <= 0) return badRequest("invalid minutes");
      result = await store.logTime(id, body.minutes, me.id);
      break;
    case "toggleSub":
      if (!isNum(body.index)) return badRequest("invalid index");
      result = await store.toggleSub(id, body.index);
      break;
    case "toggleTag":
      if (!isStr(body.tagId)) return badRequest("invalid tagId");
      result = await store.toggleTag(id, body.tagId);
      break;
    default:
      return badRequest("unknown action");
  }

  if (!result) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(result);
}

// DELETE /api/tasks/:id
export async function DELETE(req: Request, { params }: Ctx) {
  const me = await currentUser(req);
  if (!me) return unauthorized();
  const { id } = await params;
  const result = await getStore().deleteTask(id, me.id);
  if (!result) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(result);
}
