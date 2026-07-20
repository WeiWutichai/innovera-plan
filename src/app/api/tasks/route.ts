import { NextResponse } from "next/server";
import { getStore, type CreateTaskInput } from "@/server/store";
import { badRequest, currentUser, readJson, unauthorized } from "@/server/guard";
import { STATUS_ORDER } from "@/lib/types";

export const dynamic = "force-dynamic";

// POST /api/tasks → create a task (owned by the authenticated user).
export async function POST(req: Request) {
  const me = await currentUser(req);
  if (!me) return unauthorized();
  const body = await readJson<Partial<CreateTaskInput>>(req);
  if (!body || typeof body.title !== "string" || !body.title.trim()) {
    return badRequest("title required");
  }
  if (typeof body.projectId !== "string" || !STATUS_ORDER.includes(body.status as never)) {
    return badRequest("invalid project or status");
  }
  const input: CreateTaskInput = {
    title: body.title,
    projectId: body.projectId,
    due: typeof body.due === "string" ? body.due : null,
    status: body.status!,
    urgent: !!body.urgent,
    important: !!body.important,
    tags: Array.isArray(body.tags) ? body.tags.filter((t): t is string => typeof t === "string") : [],
  };
  const result = await getStore().createTask(input, me.id);
  return NextResponse.json(result, { status: 201 });
}
