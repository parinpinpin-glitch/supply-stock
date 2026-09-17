import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import SupplyForm from "@/components/SupplyForm";
import { stockBadge, supplyThumb } from "@/components/stock";
import { findSupply, movementsForSupply, MOVEMENT_LABEL, listOrders, isOverdue } from "@/lib/store";

function MovementList({ supplyId }: { supplyId: string }) {
  const list = movementsForSupply(supplyId, 10);
  if (list.length === 0) {
    return (
      <div className="mt-2 rounded-xl bg-white p-4 text-center text-sm text-gray-400 shadow-sm">
        ยังไม่มีประวัติ (เบิกครั้งแรกแล้วจะขึ้นที่นี่)
      </div>
    );
  }
  return (
    <div className="mt-2 space-y-1">
      {list.map((m) => (
        <div key={m.id} className="flex items-center justify-between rounded-xl bg-white px-4 py-2.5 text-sm shadow-sm">
          <div>
            <span className="font-semibold">{MOVEMENT_LABEL[m.movement_type]}</span>
            <span className="text-gray-500"> • {m.performed_by_name}</span>
            <span className="block text-xs text-gray-400">
              {new Date(m.performed_at).toLocaleString("th-TH")}
              {m.reference_purchase_order_id ? ` • ref ${m.reference_purchase_order_id.slice(0, 8)}` : ""}
              {m.notes ? ` • ${m.notes}` : ""}
            </span>
          </div>
          {m.movement_type === "issue" ? (
            <span className="font-bold text-red-600">−{m.qty}</span>
          ) : m.movement_type === "receive" ? (
            <span className="font-bold text-green-700">+{m.qty}</span>
          ) : (
            <span className="font-bold text-blue-700">{m.qty}</span>
          )}
        </div>
      ))}
    </div>
  );
}

function PendingOrders({ supplyId }: { supplyId: string }) {
  const list = listOrders({ status: "pending", supply_id: supplyId });
  if (list.length === 0) return null;
  return (
    <div className="mt-4">
      <h2 className="font-bold">สั่งซื้อค้างรับ ({list.length})</h2>
      <div className="mt-2 space-y-1">
        {list.map((o) => (
          <div key={o.id} className="flex items-center justify-between rounded-xl bg-white px-4 py-2.5 text-sm shadow-sm">
            <div>
              <span className="font-semibold">สั่ง {o.ordered_qty}</span>
              <span className="text-gray-500"> • คาดเข้า {o.expected_arrival_date}</span>
              {isOverdue(o) && <span className="ml-1 font-semibold text-red-700">(เกินกำหนด)</span>}
            </div>
            <a href={`/orders/${o.id}/receive`} className="rounded-lg bg-green-700 px-3 py-1.5 text-xs font-semibold text-white">
              รับของเข้า
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SupplyDetailPage({ params }: { params: { id: string } }) {
  const user = getSession();
  if (!user) redirect("/login");
  const supply = findSupply(params.id);
  if (!supply) notFound();

  const canWrite = user.role === "purchaser" || user.role === "admin";

  const rows: Array<[string, string]> = [
    ["รหัส/ชื่อย่อ", supply.item_code_or_short_name || "—"],
    ["supplier", supply.supplier_name || "—"],
    ["คงเหลือ", `${supply.current_stock} ${supply.unit}`],
    ["หน่วย", supply.unit],
    ["ROP", String(supply.reorder_point)],
    ["Lead time", `${supply.lead_time_days} วัน`],
    ["สั่งซื้อครั้งล่าสุด", supply.last_purchase_date ?? "—"]
  ];

  return (
    <AppShell user={user}>
      <a href="/supply" className="text-sm text-blue-700">← กลับรายการ Supply</a>
      <div className="mt-1 flex items-center gap-2">
        <h1 className="text-xl font-bold">{supply.item_name}</h1>
        {stockBadge(supply)}
      </div>

      {supply.image_url ? (
        <img src={supply.image_url} alt={supply.item_name} className="mt-4 max-h-64 w-full rounded-xl border object-contain bg-white" />
      ) : (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-white p-4 text-sm text-gray-400 shadow-sm">
          {supplyThumb(null)}
          <span>{canWrite ? "ยังไม่มีรูป — เพิ่มได้ในฟอร์มแก้ไขด้านล่าง" : "ยังไม่มีรูป"}</span>
        </div>
      )}

      <div className="mt-4 overflow-hidden rounded-xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <tbody>
            {rows.map(([k, v]) => (
              <tr key={k} className="border-t first:border-t-0">
                <td className="w-40 bg-gray-50 px-4 py-2 text-gray-600">{k}</td>
                <td className="px-4 py-2 font-medium">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-sm">
        <a href="/issue" className="rounded-lg bg-blue-100 px-3 py-1.5 font-semibold text-blue-700">เบิกของ →</a>
        {canWrite && (
          <a href={`/supply/${supply.id}/order`} className="rounded-lg bg-blue-700 px-3 py-1.5 font-semibold text-white">สั่งซื้อแล้ว →</a>
        )}
      </div>

      <PendingOrders supplyId={supply.id} />

      <h2 className="mt-6 font-bold">ประวัติล่าสุด</h2>
      <MovementList supplyId={supply.id} />

      {canWrite ? (
        <>
          <h2 className="mt-6 font-bold">แก้ไขข้อมูล</h2>
          <SupplyForm initial={supply} />
        </>
      ) : (
        <p className="mt-6 rounded-xl bg-gray-100 p-4 text-sm text-gray-600">
          สิทธิ์ผู้ใช้ทั่วไปดูได้อย่างเดียว — การแก้ไขเป็นของ (“ผู้ซื้อ”/Admin)
        </p>
      )}
    </AppShell>
  );
}
