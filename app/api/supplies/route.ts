import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, decodeSession } from "@/lib/auth";
import { readSupplies, writeSupplies, validateSupplyInput } from "@/lib/store";

function session() {
  return decodeSession(cookies().get(SESSION_COOKIE)?.value);
}

// GET /api/supplies — ดูได้ทุก role ที่ login แล้ว
export async function GET() {
  const user = session();
  if (!user) return NextResponse.json({ error: "กรุณา login" }, { status: 401 });
  return NextResponse.json({ supplies: readSupplies() });
}

// POST /api/supplies — เพิ่มได้เฉพาะ Admin
export async function POST(req: Request) {
  const user = session();
  if (!user) return NextResponse.json({ error: "กรุณา login" }, { status: 401 });
  if (user.role !== "admin") {
    return NextResponse.json({ error: "ไม่มีสิทธิ์เพิ่มรายการ (เฉพาะ Admin)" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const v = validateSupplyInput(body);
  if (!v.ok || !v.value) return NextResponse.json({ error: v.error }, { status: 400 });

  const now = new Date().toISOString();
  const created = {
    id: `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    ...v.value,
    last_purchase_date: null,
    image_url: null,
    created_at: now,
    updated_at: now
  };

  const all = readSupplies();
  all.unshift(created);
  writeSupplies(all);
  return NextResponse.json({ supply: created }, { status: 201 });
}
