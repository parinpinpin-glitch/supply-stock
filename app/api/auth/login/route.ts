import { NextResponse } from "next/server";
import { SESSION_COOKIE, encodeSession } from "@/lib/auth";
import { findUserByEmail } from "@/lib/store";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = String(body?.email ?? "").trim();
  const password = String(body?.password ?? "");

  if (!email || !password) {
    return NextResponse.json({ error: "กรุณากรอกอีเมลและรหัสผ่าน" }, { status: 400 });
  }

  const found = findUserByEmail(email);
  if (!found || found.password !== password) {
    return NextResponse.json({ error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
  }
  if (!found.is_active) {
    return NextResponse.json({ error: "บัญชีนี้ถูกปิดใช้งาน ติดต่อ Admin" }, { status: 403 });
  }

  const res = NextResponse.json({
    ok: true,
    user: { id: found.id, email: found.email, name: found.name, role: found.role }
  });
  res.cookies.set(SESSION_COOKIE, encodeSession({ id: found.id, email: found.email, name: found.name, role: found.role }), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12
  });
  return res;
}
