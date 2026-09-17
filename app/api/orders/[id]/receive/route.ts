import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, decodeSession } from "@/lib/auth";
import { findSupply, updateSupply, findOrder, updateOrder, addMovement, todayISO } from "@/lib/store";
import { saveInvoice } from "@/lib/invoices";
import { notify } from "@/lib/email";

// POST /api/orders/:id/receive — “รับของเข้า” (purchaser / admin)
// form-data: received_qty, invoice (File รูป, บังคับ), notes?
// ผล: order → received, stock เพิ่ม, last_purchase_date = วันรับ, movement receive
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = decodeSession(cookies().get(SESSION_COOKIE)?.value);
  if (!user) return NextResponse.json({ error: "กรุณา login" }, { status: 401 });
  if (user.role !== "purchaser" && user.role !== "admin") {
    return NextResponse.json({ error: "เฉพาะผู้ซื้อ/Admin" }, { status: 403 });
  }

  const order = await findOrder(params.id);
  if (!order) return NextResponse.json({ error: "ไม่พบรายการสั่งซื้อ" }, { status: 404 });
  if (order.received_status === "received")
    return NextResponse.json({ error: "รายการนี้รับของเข้าแล้ว" }, { status: 400 });

  const form = await req.formData().catch(() => null);
  const received_qty = Number(form?.get("received_qty"));
  const notes = String(form?.get("notes") ?? "").trim().slice(0, 500);
  const invoice = form?.get("invoice") as File | null;

  if (!Number.isFinite(received_qty) || received_qty <= 0)
    return NextResponse.json({ error: "จำนวนที่รับต้องมากกว่า 0" }, { status: 400 });

  const saved = await saveInvoice(invoice, order.id);
  if (!saved.ok) return NextResponse.json({ error: saved.error }, { status: 400 });

  const supply = await findSupply(order.supply_id);
  if (!supply) return NextResponse.json({ error: "ไม่พบรายการ Supply ของ order นี้" }, { status: 404 });

  // เพิ่ม stock + อัปเดต last_purchase_date
  const stocked = await updateSupply(supply.id, {
    current_stock: supply.current_stock + received_qty,
    last_purchase_date: todayISO()
  });

  const updated = await updateOrder(order.id, {
    received_status: "received",
    received_at: new Date().toISOString(),
    received_qty,
    invoice_image_url: saved.url!,
    notes: notes || order.notes
  });

  await addMovement({
    supply_id: order.supply_id,
    movement_type: "receive",
    qty: received_qty,
    performed_by_user_id: user.id,
    performed_by_name: user.name,
    performed_at: new Date().toISOString(),
    reference_purchase_order_id: order.id,
    notes: notes || "รับของเข้า"
  });

  await notify(
    "received",
    `[SupplyStock] รับของเข้าแล้ว: ${stocked!.item_name}`,
    `<p>รับ <b>${stocked!.item_name}</b> จำนวน <b>${received_qty} ${stocked!.unit}</b> แล้ว (stock ใหม่ ${stocked!.current_stock})</p><p>รับโดย ${user.name}</p>`,
    { supply_id: order.supply_id, order_id: order.id }
  );

  return NextResponse.json({ order: updated, supply: stocked });
}
