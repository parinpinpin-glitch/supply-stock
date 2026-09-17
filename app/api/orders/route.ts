import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, decodeSession } from "@/lib/auth";
import { readSupplies, createOrder, listOrders, addMovement, todayISO } from "@/lib/store";

// GET /api/orders?status=pending|received|overdue — ดูได้เฉพาะ purchaser / admin
export async function GET(req: Request) {
  const user = decodeSession(cookies().get(SESSION_COOKIE)?.value);
  if (!user) return NextResponse.json({ error: "กรุณา login" }, { status: 401 });
  if (user.role !== "purchaser" && user.role !== "admin") {
    return NextResponse.json({ error: "เฉพาะผู้ซื้อ/Admin" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as "pending" | "received" | "overdue" | null;
  const supply_id = searchParams.get("supply_id") || undefined;
  const orders = listOrders({ status: status || undefined, supply_id });
  const supplies = readSupplies();
  const withNames = orders.map((o) => ({
    ...o,
    item_name: supplies.find((s) => s.id === o.supply_id)?.item_name ?? "(ถูกลบ)",
    unit: supplies.find((s) => s.id === o.supply_id)?.unit ?? ""
  }));
  return NextResponse.json({ orders: withNames });
}

// POST /api/orders — “สั่งซื้อแล้ว” (purchaser / admin)
// body: { supply_id, ordered_qty, expected_arrival_date (YYYY-MM-DD), notes? }
export async function POST(req: Request) {
  const user = decodeSession(cookies().get(SESSION_COOKIE)?.value);
  if (!user) return NextResponse.json({ error: "กรุณา login" }, { status: 401 });
  if (user.role !== "purchaser" && user.role !== "admin") {
    return NextResponse.json({ error: "เฉพาะผู้ซื้อ/Admin" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const supply_id = String(body?.supply_id ?? "");
  const ordered_qty = Number(body?.ordered_qty);
  const expected = String(body?.expected_arrival_date ?? "");
  const notes = String(body?.notes ?? "").trim().slice(0, 500);

  const supply = readSupplies().find((s) => s.id === supply_id);
  if (!supply) return NextResponse.json({ error: "ไม่พบรายการ Supply" }, { status: 404 });
  if (!supply.is_active) return NextResponse.json({ error: "รายการนี้ปิดใช้งานแล้ว" }, { status: 400 });
  if (!Number.isFinite(ordered_qty) || ordered_qty <= 0)
    return NextResponse.json({ error: "จำนวนที่สั่งต้องมากกว่า 0" }, { status: 400 });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(expected) || Number.isNaN(new Date(expected + "T00:00:00").getTime()))
    return NextResponse.json({ error: "กรุณาระบุวันที่คาดว่าของจะเข้า" }, { status: 400 });
  if (expected < todayISO())
    return NextResponse.json({ error: "วันที่คาดว่าของจะเข้าต้องไม่เป็นอดีต" }, { status: 400 });

  const order = createOrder({
    supply_id,
    ordered_qty,
    ordered_by_user_id: user.id,
    ordered_by_name: user.name,
    ordered_at: new Date().toISOString(),
    expected_arrival_date: expected,
    received_status: "pending",
    received_at: null,
    received_qty: null,
    invoice_image_url: null,
    notes
  });

  addMovement({
    supply_id,
    movement_type: "order_marked",
    qty: ordered_qty,
    performed_by_user_id: user.id,
    performed_by_name: user.name,
    performed_at: new Date().toISOString(),
    reference_purchase_order_id: order.id,
    notes: `คาดเข้า ${expected}`
  });

  return NextResponse.json({ order }, { status: 201 });
}
