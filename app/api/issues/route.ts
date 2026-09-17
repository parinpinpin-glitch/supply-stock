import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, decodeSession } from "@/lib/auth";
import { readSupplies, writeSupplies, addMovement } from "@/lib/store";
import { notify } from "@/lib/email";

// POST /api/issues — เบิกของได้ทุก role ที่ login แล้ว
// กติกา PRODUCT.md: จำนวน > 0, ห้ามเบิกเกิน stock, ตัด stock ทันที + บันทึก history
export async function POST(req: Request) {
  const user = decodeSession(cookies().get(SESSION_COOKIE)?.value);
  if (!user) return NextResponse.json({ error: "กรุณา login" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const supply_id = String(body?.supply_id ?? "");
  const qty = Number(body?.qty);
  const notes = String(body?.notes ?? "").trim().slice(0, 500);

  if (!supply_id) return NextResponse.json({ error: "กรุณาเลือกรายการ" }, { status: 400 });
  if (!Number.isFinite(qty) || qty <= 0)
    return NextResponse.json({ error: "จำนวนเบิกต้องมากกว่า 0" }, { status: 400 });

  const all = readSupplies();
  const idx = all.findIndex((s) => s.id === supply_id);
  if (idx === -1) return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 404 });

  const supply = all[idx];
  if (!supply.is_active) return NextResponse.json({ error: "รายการนี้ปิดใช้งานแล้ว" }, { status: 400 });
  if (qty > supply.current_stock)
    return NextResponse.json(
      { error: `เบิกเกิน stock คงเหลือ (เหลือ ${supply.current_stock} ${supply.unit})` },
      { status: 400 }
    );

  // ตัด stock ทันที
  all[idx] = { ...supply, current_stock: supply.current_stock - qty, updated_at: new Date().toISOString() };
  writeSupplies(all);

  const movement = addMovement({
    supply_id,
    movement_type: "issue",
    qty,
    performed_by_user_id: user.id,
    performed_by_name: user.name,
    performed_at: new Date().toISOString(),
    reference_purchase_order_id: null,
    notes
  });

  const lowStock = all[idx].current_stock <= all[idx].reorder_point;

  // แจ้งเตือนครั้งเดียวตอน “ข้ามเส้น” ROP (ก่อนเบิกยังไม่ขาด หลังเบิกขาด) — กันสแปม
  if (supply.current_stock > supply.reorder_point && lowStock) {
    await notify(
      "low_stock",
      `[SupplyStock] ${all[idx].item_name} ถึงจุดต้องสั่งซื้อ`,
      `<p><b>${all[idx].item_name}</b> เหลือ <b>${all[idx].current_stock} ${all[idx].unit}</b> (ROP ${all[idx].reorder_point})</p><p>เบิกโดย ${user.name}</p>`,
      { supply_id }
    );
  }

  return NextResponse.json({ supply: all[idx], movement, lowStock }, { status: 201 });
}
