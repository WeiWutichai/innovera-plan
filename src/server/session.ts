// Signed (JWS) session token + cookie helpers. jose only, so this module is
// safe to import from Edge middleware/proxy (no Node crypto / bcrypt).
//
// The token carries the user's `sessionVersion` (sv). The proxy checks the
// signature/expiry as a fast first line; the authoritative revocation check
// (sv still current, account not disabled) happens in the Node layer, where
// Prisma is available — see server/guard.ts.

import { jwtVerify, SignJWT } from "jose";

export const SESSION_COOKIE = "innovera_session";
const SESSION_TTL = 60 * 60 * 24 * 7; // 7 days (seconds)

export interface SessionClaims {
  userId: string;
  sv: number;
}

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

export async function createSessionToken(userId: string, sessionVersion: number): Promise<string> {
  return new SignJWT({ sub: userId, sv: sessionVersion })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + SESSION_TTL)
    .sign(secretKey());
}

/** Verify signature + expiry, returning the claims (sub + sv), or null. */
export async function verifySessionToken(token: string | undefined): Promise<SessionClaims | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (typeof payload.sub === "string" && typeof payload.sv === "number") {
      return { userId: payload.sub, sv: payload.sv };
    }
    return null;
  } catch {
    return null;
  }
}

/** Read + verify the session claims from a Request's cookies. */
export async function getSessionClaims(req: Request): Promise<SessionClaims | null> {
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
