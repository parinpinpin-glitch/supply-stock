"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Supply } from "@/lib/store";

const inputCls = "w-full rounded-lg border px-3 py-2.5";
const labelCls = "mb-1 block text-sm font-medium";

export default function SupplyForm({ initial }: { initial?: Supply }) {
  const router = useRouter();
  const [form, setForm] = useState({
    item_name: initial?.item_name ?? "",
    item_code_or_short_name: initial?.item_code_or_short_name ?? "",
    supplier_name: initial?.supplier_name ?? "",
    current_stock: String(initial?.current_stock ?? 0),
    unit: initial?.unit ?? "ชิ้น",
    reorder_point: String(initial?.reorder_point ?? 0),
    lead_time_days: String(initial?.lead_time_days ?? 0),
    is_active: initial?.is_active ?? true
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const isEdit = Boolean(initial);

  function onFile(f: File | null) {
    setFile(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f ? URL.createObjectURL(f) : "");
  }

  async function removeImage() {
    if (!initial || !confirm("ลบรูปของรายการนี้?")) return;
    setError("");
    const res = await fetch(`/api/supplies/${initial.id}/image`, { method: "DELETE" });
    if (!res.ok) {
      setError("ลบรูปไม่สำเร็จ");
      return;
    }
    router.refresh();
  }

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload = {
        ...form,
        current_stock: Number(form.current_stock),
        reorder_point: Number(form.reorder_point),
        lead_time_days: Number(form.lead_time_days)
      };
      const url = isEdit ? `/api/supplies/${initial!.id}` : "/api/supplies";
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "บันทึกไม่สำเร็จ");
        return;
      }
      if (file) {
        const fd = new FormData();
        fd.append("image", file);
        const up = await fetch(`/api/supplies/${data.supply.id}/image`, { method: "POST", body: fd });
        const ud = await up.json().catch(() => ({}));
        if (!up.ok) {
          setError(`บันทึกข้อมูลแล้ว แต่อัปโหลดรูปไม่สำเร็จ: ${ud?.error ?? ""}`);
          setLoading(false);
          return;
        }
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
        <label className={labelCls} htmlFor="item_name">ชื่อรายการ *</label>
        <input id="item_name" required value={form.item_name} onChange={(e) => set("item_name", e.target.value)} className={inputCls} placeholder="เช่น กระดาษ A4 80 แกรม" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls} htmlFor="code">รหัส/ชื่อย่อ</label>
          <input id="code" value={form.item_code_or_short_name} onChange={(e) => set("item_code_or_short_name", e.target.value)} className={inputCls} placeholder="เช่น A4-80" />
        </div>
        <div>
          <label className={labelCls} htmlFor="unit">หน่วย</label>
          <input id="unit" value={form.unit} onChange={(e) => set("unit", e.target.value)} className={inputCls} placeholder="ชิ้น / รีม / กล่อง" />
        </div>
      </div>
      <div>
        <label className={labelCls} htmlFor="supplier">supplier</label>
        <input id="supplier" value={form.supplier_name} onChange={(e) => set("supplier_name", e.target.value)} className={inputCls} placeholder="ชื่อร้าน/บริษัท" />
      </div>
      <div>
        <label className={labelCls} htmlFor="photo">รูป item (ไม่บังคับ)</label>
        {isEdit && initial!.image_url && !preview && (
          <div className="mb-2 flex items-center gap-2">
            <img src={initial!.image_url} alt="" className="h-16 w-16 rounded-lg border object-cover" />
            <button type="button" onClick={removeImage} className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">
              ลบรูป
            </button>
          </div>
        )}
        {preview && (
          <img src={preview} alt="preview" className="mb-2 h-32 rounded-lg border object-contain" />
        )}
        <input
          id="photo"
          type="file"
          accept="image/*"
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          className={inputCls}
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelCls} htmlFor="stock">คงเหลือ</label>
          <input id="stock" type="number" min={0} step="any" required value={form.current_stock} onChange={(e) => set("current_stock", e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="rop">ROP</label>
          <input id="rop" type="number" min={0} step="any" required value={form.reorder_point} onChange={(e) => set("reorder_point", e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="lead">Lead time (วัน)</label>
          <input id="lead" type="number" min={0} step={1} required value={form.lead_time_days} onChange={(e) => set("lead_time_days", e.target.value)} className={inputCls} />
        </div>
      </div>
      {isEdit && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.is_active} onChange={(e) => set("is_active", e.target.checked)} />
          เปิดใช้งานรายการนี้
        </label>
      )}

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <button type="submit" disabled={loading} className="w-full rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white disabled:opacity-60">
        {loading ? "กำลังบันทึก…" : isEdit ? "บันทึกการแก้ไข" : "เพิ่มรายการ"}
      </button>
    </form>
  );
}
