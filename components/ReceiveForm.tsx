"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ReceiveForm({ orderId, unit, orderedQty }: { orderId: string; unit: string; orderedQty: number }) {
  const router = useRouter();
  const [qty, setQty] = useState(String(orderedQty));
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function onFile(f: File | null) {
    setFile(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f ? URL.createObjectURL(f) : "");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const n = Number(qty);
    if (!Number.isFinite(n) || n <= 0) {
      setError("จำนวนที่รับต้องมากกว่า 0");
      return;
    }
    if (!file) {
      setError("กรุณาแนบรูป invoice");
      return;
    }
    setLoading(true);
    try {
      const form = new FormData();
      form.append("received_qty", String(n));
      form.append("notes", notes);
      form.append("invoice", file);
      const res = await fetch(`/api/orders/${orderId}/receive`, { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "บันทึกไม่สำเร็จ");
        return;
      }
      router.push(`/supply/${data.supply.id}`);
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
        <label className="mb-1 block text-sm font-medium" htmlFor="rqty">
          จำนวนที่รับจริง ({unit}) * <span className="font-normal text-gray-500">(สั่งไว้ {orderedQty})</span>
        </label>
        <input id="rqty" type="number" min={1} step="any" required value={qty} onChange={(e) => setQty(e.target.value)} className="w-full rounded-lg border px-3 py-3 text-lg" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="invoice">รูป invoice *</label>
        <input
          id="invoice"
          type="file"
          accept="image/*"
          required
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          className="w-full rounded-lg border px-3 py-2.5"
        />
        {preview && (
          <img src={preview} alt="preview invoice" className="mt-2 max-h-64 rounded-lg border object-contain" />
        )}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="rnotes">หมายเหตุ (ถ้ามี)</label>
        <input id="rnotes" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full rounded-lg border px-3 py-2.5" />
      </div>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <button type="submit" disabled={loading} className="w-full rounded-lg bg-green-700 px-4 py-3 font-semibold text-white disabled:opacity-60">
        {loading ? "กำลังบันทึก…" : "รับของเข้า"}
      </button>
    </form>
  );
}
