import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, decodeSession } from "@/lib/auth";
import { findSupply, updateSupply, validateSupplyInput } from "@/lib/store";

function session() {
  return decodeSession(cookies().get(SESSION_COOKIE)?.value);
}

// GET /api/supplies/:id — ดูได้ทุก role ที่ login แล้ว
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = session();
  if (!user) return NextResponse.json({ error: "กรุณา login" }, { status: 401 });
  const found = await findSupply(params.id);
  if (!found) return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 404 });
  return NextResponse.json({ supply: found });
}

// PUT /api/supplies/:id — แก้ไขได้เฉพาะ purchaser / admin
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const user = session();
  if (!user) return NextResponse.json({ error: "กรุณา login" }, { status: 401 });
  if (user.role !== "purchaser" && user.role !== "admin") {
    return NextResponse.json({ error: "ไม่มีสิทธิ์แก้ไข (เฉพาะผู้ซื้อ/Admin)" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const v = validateSupplyInput(body);
  if (!v.ok || !v.value) return NextResponse.json({ error: v.error }, { status: 400 });

  const updated = await updateSupply(params.id, v.value);
  if (!updated) return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 404 });
  return NextResponse.json({ supply: updated });
}
