"use client";

import { useMemo, useState } from "react";
import type { Supply } from "@/lib/store";
import type { SessionUser } from "@/lib/auth";
import { stockBadge, supplyThumb } from "@/components/stock";

export default function SupplyList({ user, supplies }: { user: SessionUser; supplies: Supply[] }) {
  const [q, setQ] = useState("");
  const [onlyLow, setOnlyLow] = useState(false);
  const canAdd = user.role === "admin";

  const lowCount = useMemo(
    () => supplies.filter((s) => s.is_active && s.current_stock <= s.reorder_point).length,
    [supplies]
  );

  const filtered = useMemo(() => {
    let list = supplies;
    if (onlyLow) list = list.filter((s) => s.is_active && s.current_stock <= s.reorder_point);
    const needle = q.trim().toLowerCase();
    if (!needle) return list;
    return list.filter(
      (s) =>
        s.item_name.toLowerCase().includes(needle) ||
        (s.item_code_or_short_name || "").toLowerCase().includes(needle)
    );
  }, [q, supplies, onlyLow]);

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Supply ({supplies.length})</h1>
        {canAdd && (
          <a href="/supply/new" className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white">
            + เพิ่มรายการ
          </a>
        )}
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="ค้นหาด้วยชื่อหรือรหัส…"
        className="mt-4 w-full rounded-lg border bg-white px-3 py-2.5"
      />

      <div className="mt-2 flex gap-2 text-sm">
        <button
          type="button"
          onClick={() => setOnlyLow(false)}
          className={`rounded-full px-3 py-1.5 font-semibold ${!onlyLow ? "bg-slate-900 text-white" : "bg-white text-gray-600"}`}
        >
          ทั้งหมด ({supplies.length})
        </button>
        <button
          type="button"
          onClick={() => setOnlyLow(true)}
          className={`rounded-full px-3 py-1.5 font-semibold ${onlyLow ? "bg-red-700 text-white" : "bg-white text-gray-600"}`}
        >
          ต้องสั่งซื้อ ({lowCount})
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-4 rounded-xl bg-white p-6 text-center text-sm text-gray-500 shadow-sm">
          {supplies.length === 0
            ? "ยังไม่มีรายการ Supply"
            : onlyLow
              ? "ไม่มีรายการที่ต้องสั่งซื้อ"
              : "ไม่พบรายการที่ค้นหา"}
        </div>
      ) : (
        <>
          {/* มือถือ: cards */}
          <div className="mt-4 space-y-2 md:hidden">
            {filtered.map((s) => (
              <a key={s.id} href={`/supply/${s.id}`} className="block rounded-xl bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-start gap-2">
                    {supplyThumb(s.image_url)}
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{s.item_name}</p>
                      <p className="text-xs text-gray-500">
                        {s.item_code_or_short_name || "—"} • {s.supplier_name || "—"}
                      </p>
                    </div>
                  </div>
                  {stockBadge(s)}
                </div>
                <p className="mt-2 text-sm">
                  stock <span className="text-lg font-bold">{s.current_stock}</span> {s.unit}
                  <span className="text-gray-400"> • ROP {s.reorder_point}</span>
                </p>
              </a>
            ))}
          </div>

          {/* คอม: table */}
          <div className="mt-4 hidden overflow-hidden rounded-xl bg-white shadow-sm md:block">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-4 py-2">รูป</th>
                  <th className="px-4 py-2">ชื่อรายการ</th>
                  <th className="px-4 py-2">รหัส/ชื่อย่อ</th>
                  <th className="px-4 py-2">supplier</th>
                  <th className="px-4 py-2 text-right">stock</th>
                  <th className="px-4 py-2">หน่วย</th>
                  <th className="px-4 py-2 text-right">ROP</th>
                  <th className="px-4 py-2">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2">{supplyThumb(s.image_url, "h-10 w-10")}</td>
                    <td className="px-4 py-2">
                      <a href={`/supply/${s.id}`} className="font-medium text-blue-700">
                        {s.item_name}
                      </a>
                    </td>
                    <td className="px-4 py-2">{s.item_code_or_short_name || "—"}</td>
                    <td className="px-4 py-2">{s.supplier_name || "—"}</td>
                    <td className="px-4 py-2 text-right font-bold">{s.current_stock}</td>
                    <td className="px-4 py-2">{s.unit}</td>
                    <td className="px-4 py-2 text-right">{s.reorder_point}</td>
                    <td className="px-4 py-2">{stockBadge(s)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
