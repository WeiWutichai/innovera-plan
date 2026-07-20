import { NextResponse } from "next/server";
import { getStore } from "@/server/store";

export const dynamic = "force-dynamic";

// GET /api/bootstrap → the full dataset the client hydrates from.
export async function GET() {
  return NextResponse.json(await getStore().bootstrap());
}
