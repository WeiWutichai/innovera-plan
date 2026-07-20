// Signed (JWS) session token + cookie helpers. jose only, so this module is
// safe to import from Edge middleware (no Node crypto / bcrypt).

import { jwtVerify, SignJWT } from "jose";

export const SESSION_COOKIE = "innovera_session";
const SESSION_TTL = 60 * 60 * 24 * 7; // 7 days (seconds)

// Known placeholders that must never sign real tokens (they are public).
const INSECURE_SECRETS = new Set([
  "docker-dev-insecure-secret-change-me-please",
  "change-me-to-a-long-random-string",
]);

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("AUTH_SECRET is missing or too short (need >= 16 chars)");
  }
  if (INSECURE_SECRETS.has(secret)) {
    throw new Error("AUTH_SECRET is a known insecure placeholder — set a real random secret");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + SESSION_TTL)
    .sign(secretKey());
}

/** Returns the user id from a valid session token, or null. */
export async function verifySessionToken(token: string | undefined): Promise<string | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

/** Read + verify the session from a Request's cookies. */
export async function getSessionUserId(req: Request): Promise<string | null> {
  const cookie = req.headers.get("cookie") ?? "";
  const match = cookie.match(new RegExp(`(?:^|; )${SESSION_COOKIE}=([^;]+)`));
  return verifySessionToken(match ? decodeURIComponent(match[1]) : undefined);
}

/** Cookie attributes for the session (Secure in production). */
export function sessionCookieOptions(maxAge: number = SESSION_TTL) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}
