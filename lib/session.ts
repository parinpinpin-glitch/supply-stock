import { cookies } from "next/headers";
import { SESSION_COOKIE, decodeSession, type SessionUser } from "@/lib/auth";

export function getSession(): SessionUser | null {
  const value = cookies().get(SESSION_COOKIE)?.value;
  return decodeSession(value);
}

export function requireRole(user: SessionUser | null, allowed: SessionUser["role"][]) {
  if (!user) return false;
  return allowed.includes(user.role);
}
