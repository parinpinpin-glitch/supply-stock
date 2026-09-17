"use client";

import { useMemo, useState } from "react";
import type { Supply } from "@/lib/store";
import { supplyThumb } from "@/components/stock";

type Done = {
  item_name: string;
  qty: number;
  unit: string;
  newStock: number;
  lowStock: boolean;
  supply_id: string;
};

export default function IssueForm({ supplies }: { supplies: Supply[] }) {
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [qty, setQty] = useState("1");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<Done | null>(null);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return supplies;
    return supplies.filter(
      (s) =>
        s.item_name.toLowerCase().includes(needle) ||
        (s.item_code_or_short_name || "").toLowerCase().includes(needle)
    );
  }, [q, supplies]);

  const selected = supplies.find((s) => s.id === selectedId);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!selected) {
      setError("กรุณาเลือกรายการก่อน");
      return;
    }
    const n = Number(qty);
    if (!Number.isFinite(n) || n <= 0) {
      setError("จำนวนเบิกต้องมากกว่า 0");
      return;
    }
    if (n > selected.current_stock) {
      setError(`เบิกเกิน stock คงเหลือ (เหลือ ${selected.current_stock} ${selected.unit})`);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supply_id: selected.id, qty: n })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "เบิกไม่สำเร็จ");
        return;
      }
      setDone({
        item_name: data.supply.item_name,
        qty: n,
        unit: data.supply.unit,
        newStock: data.supply.current_stock,
        lowStock: data.lowStock,
        supply_id: data.supply.id
      });
    } catch {
      setError("เชื่อมต่อไม่ได้ กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setDone(null);
    setQty("1");
    setError("");
  }

  if (done) {
    return (
      <div className="mt-4 rounded-xl bg-white p-6 text-center shadow-sm">
        <p className="text-4xl">✅</p>
        <h2 className="mt-2 text-lg font-bold">เบิกสำเร็จ</h2>
        <p className="mt-1 text-sm text-gray-700">
          {done.item_name} × {done.qty} {done.unit}
        </p>
        <p className="mt-1 text-sm text-gray-600">
          stock คงเหลือ <span className="text-lg font-bold text-gray-900">{done.newStock}</span> {done.unit}
        </p>
        {done.lowStock && (
          <p className="mx-auto mt-2 w-fit rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
            ถึงจุดต้องสั่งซื้อแล้ว (ROP)
          </p>
        )}
        <div className="mt-4 flex gap-2">
          <button onClick={reset} className="flex-1 rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white">
            เบิกอีก
          </button>
          <a href={`/supply/${done.supply_id}`} className="flex-1 rounded-lg bg-gray-100 px-4 py-3 text-center font-semibold">
            ดูรายการ
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-4">
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <label className="mb-1 block text-sm font-medium" htmlFor="search">1. เลือกรายการ</label>
        <input
          id="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ค้นหาชื่อหรือรหัส…"
          className="w-full rounded-lg border px-3 py-2.5"
        />
        <div className="mt-2 max-h-56 space-y-1 overflow-y-auto">
          {filtered.length === 0 && <p className="py-3 text-center text-sm text-gray-400">ไม่พบรายการ</p>}
          {filtered.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelectedId(s.id)}
              className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm ${
                s.id === selectedId ? "border-blue-600 bg-blue-50 font-semibold" : "border-gray-200"
              }`}
            >
              <span className="flex min-w-0 items-center gap-2">
                {supplyThumb(s.image_url, "h-10 w-10")}
                <span className="min-w-0">
                  <span className="block truncate">{s.item_name}</span>
                  <span className="block text-xs font-normal text-gray-500">
                    เหลือ {s.current_stock} {s.unit}
                  </span>
                </span>
              </span>
              {s.id === selectedId && <span>✓</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm">
        {selected?.image_url && (
          <img src={selected.image_url} alt={selected.item_name} className="mb-2 max-h-48 w-full rounded-lg border object-contain" />
        )}
        <label className="mb-1 block text-sm font-medium" htmlFor="qty">
          2. จำนวนที่เบิก{selected ? ` (เหลือ ${selected.current_stock} ${selected.unit})` : ""}
        </label>
        <input
          id="qty"
          type="number"
          min={1}
          step="any"
          required
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          className="w-full rounded-lg border px-3 py-3 text-lg"
        />
        <div className="mt-2 flex gap-2">
          {[1, 5, 10].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setQty(String(n))}
              className="flex-1 rounded-lg bg-gray-100 px-3 py-2 text-sm font-semibold"
            >
              {n}
            </button>
          ))}
          {selected && (
            <button
              type="button"
              onClick={() => setQty(String(selected.current_stock))}
              className="flex-1 rounded-lg bg-gray-100 px-3 py-2 text-sm font-semibold"
            >
              ทั้งหมด
            </button>
          )}
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={loading || !selected}
        className="w-full rounded-lg bg-blue-700 px-4 py-3.5 text-lg font-semibold text-white disabled:opacity-50"
      >
        {loading ? "กำลังเบิก…" : "เบิก"}
      </button>
    </form>
  );
}
