// Password hashing (bcrypt). Node runtime only — never imported by middleware.
// Session/cookie helpers live in ./session (jose only, Edge-safe).

import bcrypt from "bcryptjs";

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// A valid throwaway hash so login can run bcrypt.compare even when the account
// doesn't exist / isn't active — keeps the code path constant-time and defeats
// user-enumeration by response latency.
export const DUMMY_HASH = bcrypt.hashSync("__no_such_user__", 10);

