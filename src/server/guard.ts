import { NextResponse } from "next/server";
import { getSessionClaims } from "./session";
import { getStore } from "./store";
import type { User } from "@/lib/types";

/**
 * Resolve the current session user for a route handler. Returns null when there
 * is no valid session, the user has been disabled/deleted, OR the token's
 * session version is stale (revoked by logout / password-reset / disable) — so
 * an already-issued token stops working immediately, not only after it expires.
 */
export async function currentUser(req: Request): Promise<User | null> {
  const claims = await getSessionClaims(req);
  if (!claims) return null;
  return getStore().resolveSession(claims.userId, claims.sv);
}

export const unauthorized = () => NextResponse.json({ error: "unauthenticated" }, { status: 401 });
export const forbidden = () => NextResponse.json({ error: "forbidden" }, { status: 403 });
export const badRequest = (msg = "bad request") => NextResponse.json({ error: msg }, { status: 400 });

/** Safe JSON body parse — returns null on malformed input. */
export async function readJson<T = unknown>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}
