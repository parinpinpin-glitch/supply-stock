export type UserRole = "user" | "purchaser" | "admin";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};

export const SESSION_COOKIE = "ss_session";

// บัญชีเริ่มต้น (seed ลง store ครั้งแรก — Admin เพิ่ม/ลบ/ปิดได้ที่หน้า ผู้ใช้;
// ย้ายไป Supabase Auth เมื่อใช้จริง)
export const DEMO_USERS: Array<SessionUser & { password: string }> = [
  { id: "u-user-1", email: "user@demo.local", name: "ผู้ใช้ทดสอบ", password: "password123", role: "user" },
  { id: "u-purchaser-1", email: "purchaser@demo.local", name: "ผู้ซื้อทดสอบ", password: "password123", role: "purchaser" },
  { id: "u-admin-1", email: "admin@demo.local", name: "แอดมินทดสอบ", password: "password123", role: "admin" }
];

export function findDemoUser(email: string) {
  return DEMO_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function encodeSession(user: SessionUser): string {
  return Buffer.from(JSON.stringify(user), "utf-8").toString("base64url");
}

export function decodeSession(value: string | undefined): SessionUser | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf-8"));
    if (!parsed?.id || !parsed?.email || !parsed?.role) return null;
    if (!["user", "purchaser", "admin"].includes(parsed.role)) return null;
    return parsed as SessionUser;
  } catch {
    return null;
  }
}

export const ROLE_LABEL: Record<UserRole, string> = {
  user: "ผู้ใช้",
  purchaser: "ผู้ซื้อ",
  admin: "Admin"
};
