import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, decodeSession } from "@/lib/auth";
import { listExtraEmails, addExtraEmail, setExtraEmailActive, deleteExtraEmail } from "@/lib/store";

function requireAdmin() {
  const user = decodeSession(cookies().get(SESSION_COOKIE)?.value);
  if (!user) return { error: NextResponse.json({ error: "กรุณา login" }, { status: 401 }) };
  if (user.role !== "admin")
    return { error: NextResponse.json({ error: "เฉพาะ Admin" }, { status: 403 }) };
  return { user };
}

// GET /api/extra-emails — ดูรายชื่อ (Admin)
export async function GET() {
  const { error } = requireAdmin();
  if (error) return error;
  return NextResponse.json({ emails: listExtraEmails() });
}

// POST /api/extra-emails { email } — เพิ่ม (Admin)
export async function POST(req: Request) {
  const { error } = requireAdmin();
  if (error) return error;
  const body = await req.json().catch(() => null);
  const result = addExtraEmail(String(body?.email ?? ""));
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ email: result }, { status: 201 });
}

// PUT /api/extra-emails { id, is_active } — เปิด/ปิด (Admin)
export async function PUT(req: Request) {
  const { error } = requireAdmin();
  if (error) return error;
  const body = await req.json().catch(() => null);
  const updated = setExtraEmailActive(String(body?.id ?? ""), body?.is_active !== false);
  if (!updated) return NextResponse.json({ error: "ไม่พบอีเมล" }, { status: 404 });
  return NextResponse.json({ email: updated });
}

// DELETE /api/extra-emails?id= — ลบ (Admin)
export async function DELETE(req: Request) {
  const { error } = requireAdmin();
  if (error) return error;
  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (!deleteExtraEmail(id)) return NextResponse.json({ error: "ไม่พบอีเมล" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
