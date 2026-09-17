import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { listOrders, isOverdue, readSupplies } from "@/lib/store";

export default function OrdersPage() {
  const user = getSession();
  if (!user) redirect("/login");
  if (user.role !== "purchaser" && user.role !== "admin") redirect("/no-access");

  const supplies = readSupplies();
  const nameOf = (id: string) => supplies.find((s) => s.id === id);
  const pending = listOrders({ status: "pending" });
  const received = listOrders({ status: "received" }).slice(0, 10);

  return (
    <AppShell user={user}>
      <h1 className="text-xl font-bold">สั่งซื้อค้างรับ ({pending.length})</h1>
      <p className="mt-1 text-sm text-gray-600">สั่งซื้อจากหน้า detail ของแต่ละรายการ แล้วกลับมารับของเข้าที่นี่</p>

      {pending.length === 0 ? (
        <div className="mt-4 rounded-xl bg-white p-6 text-center text-sm text-gray-500 shadow-sm">
          ตอนนี้ยังไม่มีรายการที่ต้องจัดการ
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {pending.map((o) => {
            const s = nameOf(o.supply_id);
            const overdue = isOverdue(o);
            return (
              <div key={o.id} className="rounded-xl bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{s?.item_name ?? "(ถูกลบ)"}</p>
                    <p className="text-xs text-gray-500">
                      สั่ง {o.ordered_qty} {s?.unit ?? ""} • โดย {o.ordered_by_name} • คาดเข้า {o.expected_arrival_date}
                    </p>
                  </div>
                  {overdue ? (
                    <span className="whitespace-nowrap rounded-full bg-red-700 px-2 py-0.5 text-xs font-semibold text-white">
                      เกินกำหนด
                    </span>
                  ) : (
                    <span className="whitespace-nowrap rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                      สั่งซื้อแล้ว
                    </span>
                  )}
                </div>
                <a
                  href={`/orders/${o.id}/receive`}
                  className="mt-3 block rounded-lg bg-green-700 px-4 py-2.5 text-center text-sm font-semibold text-white"
                >
                  รับของเข้า
                </a>
              </div>
            );
          })}
        </div>
      )}

      {received.length > 0 && (
        <>
          <h2 className="mt-6 font-bold">รับเข้าแล้วล่าสุด</h2>
          <div className="mt-2 space-y-1">
            {received.map((o) => {
              const s = nameOf(o.supply_id);
              return (
                <div key={o.id} className="flex items-center justify-between rounded-xl bg-white px-4 py-2.5 text-sm shadow-sm">
                  <div>
                    <span className="font-semibold">{s?.item_name ?? "(ถูกลบ)"}</span>
                    <span className="block text-xs text-gray-400">
                      รับ {o.received_qty} {s?.unit ?? ""} • {o.received_at ? new Date(o.received_at).toLocaleString("th-TH") : ""}
                    </span>
                  </div>
                  {o.invoice_image_url && (
                    <a href={o.invoice_image_url} target="_blank" className="text-xs font-semibold text-blue-700">
                      ดู invoice
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </AppShell>
  );
}
