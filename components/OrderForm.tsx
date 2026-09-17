"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OrderForm({ supplyId, unit }: { supplyId: string; unit: string }) {
  const router = useRouter();
  const [qty, setQty] = useState("10");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const n = Number(qty);
    if (!Number.isFinite(n) || n <= 0) {
      setError("จำนวนที่สั่งต้องมากกว่า 0");
      return;
    }
    if (!date) {
      setError("กรุณาระบุวันที่คาดว่าของจะเข้า");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supply_id: supplyId, ordered_qty: n, expected_arrival_date: date, notes })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "บันทึกไม่สำเร็จ");
        return;
      }
      router.push("/orders");
      router.refresh();
    } catch {
      setError("เชื่อมต่อไม่ได้ กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-4 rounded-xl bg-white p-4 shadow-sm">
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="oqty">จำนวนที่สั่ง ({unit}) *</label>
        <input id="oqty" type="number" min={1} step="any" required value={qty} onChange={(e) => setQty(e.target.value)} className="w-full rounded-lg border px-3 py-3 text-lg" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="odate">วันที่คาดว่าของจะเข้า *</label>
        <input id="odate" type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-lg border px-3 py-2.5" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="onotes">หมายเหตุ (ถ้ามี)</label>
        <input id="onotes" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full rounded-lg border px-3 py-2.5" placeholder="เช่น สั่งกับเซลล์คุณเอ" />
      </div>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <button type="submit" disabled={loading} className="w-full rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white disabled:opacity-60">
        {loading ? "กำลังบันทึก…" : "บันทึกว่าสั่งซื้อแล้ว"}
      </button>
    </form>
  );
}
