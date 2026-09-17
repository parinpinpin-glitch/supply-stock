import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { readMovements, readSupplies, MOVEMENT_LABEL, type MovementType } from "@/lib/store";

const TYPES: Array<{ v: string; label: string }> = [
  { v: "", label: "ทุกประเภท" },
  { v: "issue", label: "เบิกของ" },
  { v: "order_marked", label: "สั่งซื้อแล้ว" },
  { v: "receive", label: "รับของเข้า" }
];

function qtyBadge(type: MovementType, qty: number) {
  if (type === "issue") return <span className="font-bold text-red-600">−{qty}</span>;
  if (type === "receive") return <span className="font-bold text-green-700">+{qty}</span>;
  return <span className="font-bold text-blue-700">{qty}</span>;
}

export default async function HistoryPage({
  searchParams
}: {
  searchParams: { supply_id?: string; type?: string; q?: string };
}) {
  const user = getSession();
  if (!user) redirect("/login");

  const supplies = await readSupplies();
  const nameOf = (id: string) => supplies.find((s) => s.id === id)?.item_name ?? "(ถูกลบ)";

  const supplyId = searchParams.supply_id || "";
  const type = (searchParams.type || "") as string;
  const q = (searchParams.q || "").trim().toLowerCase();

  let list = await readMovements();
  if (supplyId) list = list.filter((m) => m.supply_id === supplyId);
  if (type) list = list.filter((m) => m.movement_type === type);
  if (q) {
    list = list.filter((m) =>
      [nameOf(m.supply_id), m.performed_by_name, m.notes || ""].some((t) =>
        t.toLowerCase().includes(q)
      )
    );
  }
  const total = list.length;
  list = list.slice(0, 100);

  return (
    <AppShell user={user}>
      <h1 className="text-xl font-bold">ประวัติการเคลื่อนไหว ({total})</h1>

      <form method="GET" action="/history" className="mt-4 space-y-2">
        <input
          name="q"
          defaultValue={searchParams.q || ""}
          placeholder="ค้นหาชื่อ item / คนทำ / หมายเหตุ…"
          className="w-full rounded-lg border bg-white px-3 py-2.5 text-sm"
        />
        <div className="flex gap-2">
          <select name="supply_id" defaultValue={supplyId} className="flex-1 rounded-lg border bg-white px-3 py-2.5 text-sm">
            <option value="">ทุก item</option>
            {supplies.map((s) => (
              <option key={s.id} value={s.id}>{s.item_name}</option>
            ))}
          </select>
          <select name="type" defaultValue={type} className="rounded-lg border bg-white px-3 py-2.5 text-sm">
            {TYPES.map((t) => (
              <option key={t.v} value={t.v}>{t.label}</option>
            ))}
          </select>
          <button className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">กรอง</button>
        </div>
      </form>
      {(supplyId || type || searchParams.q) && (
        <a href="/history" className="mt-2 inline-block text-xs text-blue-700">ล้างตัวกรอง</a>
      )}

      {list.length === 0 ? (
        <div className="mt-4 rounded-xl bg-white p-6 text-center text-sm text-gray-500 shadow-sm">
          ยังไม่มีประวัติตามเงื่อนไข
        </div>
      ) : (
        <div className="mt-4 space-y-1">
          {list.map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-2 rounded-xl bg-white px-4 py-2.5 text-sm shadow-sm">
              <div className="min-w-0">
                <p className="truncate">
                  <span className="font-semibold">{MOVEMENT_LABEL[m.movement_type]}</span>
                  {" • "}
                  <a href={`/supply/${m.supply_id}`} className="text-blue-700">{nameOf(m.supply_id)}</a>
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(m.performed_at).toLocaleString("th-TH")} • {m.performed_by_name}
                  {m.notes ? ` • ${m.notes}` : ""}
                </p>
              </div>
              {qtyBadge(m.movement_type, m.qty)}
            </div>
          ))}
        </div>
      )}
      {total > 100 && <p className="mt-2 text-center text-xs text-gray-400">แสดง 100 รายการล่าสุด</p>}
    </AppShell>
  );
}
