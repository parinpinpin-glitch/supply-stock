import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, decodeSession } from "@/lib/auth";
import { getUser, updateUser, deleteUser, activeAdminCount } from "@/lib/store";

function requireAdmin() {
  const user = decodeSession(cookies().get(SESSION_COOKIE)?.value);
  if (!user) return { error: NextResponse.json({ error: "กรุณา login" }, { status: 401 }) as NextResponse, user: null };
  if (user.role !== "admin")
    return { error: NextResponse.json({ error: "เฉพาะ Admin" }, { status: 403 }) as NextResponse, user: null };
  return { error: null, user };
}

// PUT /api/users/:id { name?, role?, is_active?, password? } — แก้ไข (Admin)
// กัน: เปลี่ยนสิทธิ์/ปิดบัญชีตัวเอง + เหลือ admin active อย่างน้อย 1 คน
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { error, user } = requireAdmin();
  if (error || !user) return error;
  const target = getUser(params.id);
  if (!target) return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const newRole = body?.role !== undefined ? String(body.role) : undefined;
  const newActive = body?.is_active !== undefined ? body.is_active !== false : undefined;

  if (params.id === user.id && (newRole !== undefined || newActive === false)) {
    return NextResponse.json({ error: "ไม่สามารถเปลี่ยนสิทธิ์หรือปิดใช้งานบัญชีตัวเอง" }, { status: 400 });
  }
  if (target.role === "admin" && target.is_active && (newRole !== undefined && newRole !== "admin" || newActive === false)) {
    if (activeAdminCount(target.id) === 0) {
      return NextResponse.json({ error: "ต้องเหลือ Admin ที่เปิดใช้งานอย่างน้อย 1 คน" }, { status: 400 });
    }
  }

  const result = updateUser(params.id, {
    ...(body?.name !== undefined ? { name: String(body.name) } : {}),
    ...(newRole !== undefined ? { role: newRole as "user" | "purchaser" | "admin" } : {}),
    ...(newActive !== undefined ? { is_active: newActive } : {}),
    ...(body?.password ? { password: String(body.password) } : {})
  });
  if (!result) return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ user: result });
}

// DELETE /api/users/:id — ลบ (Admin)
// กัน: ลบบัญชีตัวเอง + ลบ admin คนสุดท้าย
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { error, user } = requireAdmin();
  if (error || !user) return error;
  const target = getUser(params.id);
  if (!target) return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });
  if (params.id === user.id) {
    return NextResponse.json({ error: "ไม่สามารถลบบัญชีตัวเอง" }, { status: 400 });
  }
  if (target.role === "admin" && target.is_active && activeAdminCount(target.id) === 0) {
    return NextResponse.json({ error: "ต้องเหลือ Admin ที่เปิดใช้งานอย่างน้อย 1 คน" }, { status: 400 });
  }
  deleteUser(params.id);
  return NextResponse.json({ ok: true });
}
