import { NextResponse } from "next/server";
import { getStore, type CreateTaskInput } from "@/server/store";

export const dynamic = "force-dynamic";

// POST /api/tasks → create a task.
export async function POST(req: Request) {
  const body = (await req.json()) as CreateTaskInput;
  if (!body?.title || !body.title.trim()) {
    return NextResponse.json({ error: "title required" }, { status: 400 });
  }
  const result = await getStore().createTask(body);
  return NextResponse.json(result, { status: 201 });
}
