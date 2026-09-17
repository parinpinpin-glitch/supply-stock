import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { readSupplies, listOrders, isOverdue, overdueNotified, findSupply } from "@/lib/store";
import { notify, isEmailConfigured } from "@/lib/email";

export default async function DashboardPage() {
  const user = getSession();
  if (!user) redirect("/login");
  const canOrder = user.role === "purchaser" || user.role === "admin";

  const supplies = await readSupplies();
  const byId = new Map(supplies.map((s) => [s.id, s]));
  const active = supplies.filter((s) => s.is_active);
  const lowStock = active.filter((s) => s.current_stock <= s.reorder_point);
  const pending = await listOrders({ status: "pending" });
  const overdue = pending.filter((o) => isOverdue(o));
  const recentReceived = (await listOrders({ status: "received" })).slice(0, 5);

  // ตรวจ overdue ทุกครั้งที่เปิด dashboard — แจ้งเตือน order ละครั้ง (กันส่งซ้ำด้วย email log)
  for (const o of overdue) {
    if (!(await overdueNotified(o.id))) {
      const s = await findSupply(o.supply_id);
      await notify(
        "overdue_arrival",
        `[SupplyStock] ของยังไม่เข้า: ${s?.item_name ?? "?"}`,
        `<p>สั่ง <b>${s?.item_name ?? "?"}</b> จำนวน <b>${o.ordered_qty}</b> ไว้ คาดเข้า <b>${o.expected_arrival_date}</b> แต่ยังไม่มีการรับของเข้า</p>`,
        { supply_id: o.supply_id, order_id: o.id }
      );
    }
  }

  const cards = [
    { label: "item ทั้งหมด", value: active.length, href: "/supply" },
    { label: "ต่ำกว่า/เท่ากับ ROP", value: lowStock.length, href: "/supply" },
    { label: "สั่งซื้อค้างรับ", value: pending.length, href: "/orders" },
    { label: "เกินกำหนด", value: overdue.length, href: "/orders" }
  ];

  return (
    <AppShell user={user}>
      <h1 className="text-xl font-bold">Dashboard</h1>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map((c) => (
          <a key={c.label} href={c.href} className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500">{c.label}</p>
            <p className="mt-1 text-2xl font-bold">{c.value}</p>
          </a>
        ))}
      </div>

      {!isEmailConfigured() && (
        <p className="mt-3 rounded-lg bg-yellow-50 px-3 py-2 text-xs text-yellow-800">
          ยังไม่ได้ตั้งค่า RESEND_API_KEY — อีเมลจะถูกบันทึกเป็น “skipped” ใน log (ดูได้ที่หน้า ตั้งค่าการแจ้งเตือน)
        </p>
      )}

      {/* ของที่ต้องสั่งซื้อ */}
      <h2 className="mt-6 font-bold">ของที่ต้องสั่งซื้อ ({lowStock.length})</h2>
      {lowStock.length === 0 ? (
        <p className="mt-2 rounded-xl bg-white p-4 text-center text-sm text-gray-400 shadow-sm">
          ตอนนี้ยังไม่มีรายการที่ต้องจัดการ
        </p>
      ) : (
        <div className="mt-2 space-y-1">
          {lowStock.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-xl bg-white px-4 py-2.5 text-sm shadow-sm">
              <div>
                <a href={`/supply/${s.id}`} className="font-semibold text-blue-700">{s.item_name}</a>
                <span className="block text-xs text-gray-500">เหลือ {s.current_stock} {s.unit} • ROP {s.reorder_point}</span>
              </div>
              {canOrder && (
                <a href={`/supply/${s.id}/order`} className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white">
                  สั่งซื้อ
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* เกินกำหนด */}
      <h2 className="mt-6 font-bold">ถึงกำหนดเข้าแล้วแต่ยังไม่เข้า ({overdue.length})</h2>
      {overdue.length === 0 ? (
        <p className="mt-2 rounded-xl bg-white p-4 text-center text-sm text-gray-400 shadow-sm">
          ตอนนี้ยังไม่มีรายการที่ต้องจัดการ
        </p>
      ) : (
        <div className="mt-2 space-y-1">
          {overdue.map((o) => {
            const s = byId.get(o.supply_id);
            return (
              <div key={o.id} className="flex items-center justify-between rounded-xl bg-white px-4 py-2.5 text-sm shadow-sm">
                <div>
                  <span className="font-semibold">{s?.item_name ?? "?"}</span>
                  <span className="block text-xs text-gray-500">สั่ง {o.ordered_qty} • คาดเข้า {o.expected_arrival_date}</span>
                </div>
                {canOrder && (
                  <a href={`/orders/${o.id}/receive`} className="rounded-lg bg-green-700 px-3 py-1.5 text-xs font-semibold text-white">
                    รับของเข้า
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* เพิ่งรับเข้า */}
      <h2 className="mt-6 font-bold">เพิ่งรับเข้า</h2>
      {recentReceived.length === 0 ? (
        <p className="mt-2 rounded-xl bg-white p-4 text-center text-sm text-gray-400 shadow-sm">ยังไม่มีประวัติรับของเข้า</p>
      ) : (
        <div className="mt-2 space-y-1">
          {recentReceived.map((o) => {
            const s = byId.get(o.supply_id);
            return (
              <div key={o.id} className="flex items-center justify-between rounded-xl bg-white px-4 py-2.5 text-sm shadow-sm">
                <div>
                  <span className="font-semibold">{s?.item_name ?? "?"}</span>
                  <span className="block text-xs text-gray-400">
                    รับ {o.received_qty} {s?.unit ?? ""} • {o.received_at ? new Date(o.received_at).toLocaleString("th-TH") : ""}
                  </span>
                </div>
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">รับแล้ว</span>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
