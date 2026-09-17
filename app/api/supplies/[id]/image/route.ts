import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, decodeSession } from "@/lib/auth";
import { findSupply, setSupplyImage } from "@/lib/store";
import { saveUploadImage, deleteUpload } from "@/lib/invoices";

function role() {
  const user = decodeSession(cookies().get(SESSION_COOKIE)?.value);
  if (!user) return { error: NextResponse.json({ error: "กรุณา login" }, { status: 401 }) };
  if (user.role !== "purchaser" && user.role !== "admin") {
    return { error: NextResponse.json({ error: "เฉพาะผู้ซื้อ/Admin" }, { status: 403 }) };
  }
  return {};
}

// POST /api/supplies/:id/image — แนบ/เปลี่ยนรูป item (form-data: image)
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { error } = role();
  if (error) return error;
  const supply = await findSupply(params.id);
  if (!supply) return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 404 });

  const form = await req.formData().catch(() => null);
  const saved = await saveUploadImage((form?.get("image") as File | null) ?? null, params.id.slice(0, 12), {
    requiredMessage: "กรุณาเลือกรูปภาพ"
  });
  if (!saved.ok || !saved.url) return NextResponse.json({ error: saved.error }, { status: 400 });

  await deleteUpload(supply.image_url);
  const updated = await setSupplyImage(params.id, saved.url);
  return NextResponse.json({ supply: updated });
}

// DELETE /api/supplies/:id/image — ลบรูป item
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { error } = role();
  if (error) return error;
  const supply = await findSupply(params.id);
  if (!supply) return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 404 });
  await deleteUpload(supply.image_url);
  const updated = await setSupplyImage(params.id, null);
  return NextResponse.json({ supply: updated });
}
