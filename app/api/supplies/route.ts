import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, decodeSession } from "@/lib/auth";
import { readSupplies, createSupply, validateSupplyInput } from "@/lib/store";

function session() {
  return decodeSession(cookies().get(SESSION_COOKIE)?.value);
}

// GET /api/supplies — ดูได้ทุก role ที่ login แล้ว
export async function GET() {
  const user = session();
  if (!user) return NextResponse.json({ error: "กรุณา login" }, { status: 401 });
  return NextResponse.json({ supplies: await readSupplies() });
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

  const created = await createSupply(v.value);
  return NextResponse.json({ supply: created }, { status: 201 });
}
