import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, decodeSession } from "@/lib/auth";
import { listUsers, createUser } from "@/lib/store";

function requireAdmin() {
  const user = decodeSession(cookies().get(SESSION_COOKIE)?.value);
  if (!user) return { error: NextResponse.json({ error: "กรุณา login" }, { status: 401 }) };
  if (user.role !== "admin") return { error: NextResponse.json({ error: "เฉพาะ Admin" }, { status: 403 }) };
  return { user };
}

// GET /api/users — รายชื่อ (Admin)
export async function GET() {
  const { error } = requireAdmin();
  if (error) return error;
  return NextResponse.json({ users: await listUsers() });
}

// POST /api/users { name, email, password, role } — เพิ่ม (Admin)
export async function POST(req: Request) {
  const { error } = requireAdmin();
  if (error) return error;
  const body = await req.json().catch(() => null);
  const result = await createUser({
    name: String(body?.name ?? ""),
    email: String(body?.email ?? ""),
    password: String(body?.password ?? ""),
    role: body?.role
  });
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ user: result }, { status: 201 });
}
