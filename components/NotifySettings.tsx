"use client";

import { useState } from "react";
import type { ExtraEmail, EmailLog, EmailEventType } from "@/lib/store";

const EMAIL_EVENT_LABEL: Record<EmailEventType, string> = {
  low_stock: "ของถึงจุดต้องสั่งซื้อ",
  overdue_arrival: "ของไม่เข้าตามกำหนด",
  received: "รับของเข้าแล้ว"
};

export default function NotifySettings({ initial, logs, configured }: { initial: ExtraEmail[]; logs: EmailLog[]; configured: boolean }) {
  const [emails, setEmails] = useState(initial);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function refresh() {
    const r = await fetch("/api/extra-emails");
    const d = await r.json();
    if (r.ok) setEmails(d.emails);
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const r = await fetch("/api/extra-emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: input })
      });
      const d = await r.json();
      if (!r.ok) {
        setError(d?.error ?? "เพิ่มไม่สำเร็จ");
        return;
      }
      setInput("");
      await refresh();
    } finally {
      setLoading(false);
    }
  }

  async function toggle(em: ExtraEmail) {
    await fetch("/api/extra-emails", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: em.id, is_active: !em.is_active })
    });
    await refresh();
  }

  async function remove(id: string) {
    if (!confirm("ลบอีเมลนี้?")) return;
    await fetch(`/api/extra-emails?id=${id}`, { method: "DELETE" });
    await refresh();
  }

  return (
    <div>
      <div className="mt-4 rounded-xl bg-white p-4 shadow-sm">
        <p className="text-sm text-gray-600">ระบบส่งอีเมลเมื่อ: ของถึง ROP / ของไม่เข้าตามกำหนด / รับของเข้าแล้ว</p>
        <p className="mt-1 text-xs text-gray-500">
          สถานะการส่ง: {configured ? "พร้อมส่ง (มี RESEND_API_KEY)" : "ยังไม่ตั้งค่า RESEND_API_KEY — จะบันทึกเป็น skipped"}
        </p>
      </div>

      <h2 className="mt-6 font-bold">อีเมลเพิ่มเติม ({emails.length})</h2>
      <form onSubmit={add} className="mt-2 flex gap-2">
        <input
          type="email"
          required
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="name@company.com"
          className="flex-1 rounded-lg border bg-white px-3 py-2.5"
        />
        <button disabled={loading} className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
          เพิ่ม
        </button>
      </form>
      {error && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div className="mt-2 space-y-1">
        {emails.map((em) => (
          <div key={em.id} className="flex items-center justify-between rounded-xl bg-white px-4 py-2.5 text-sm shadow-sm">
            <span className={em.is_active ? "" : "text-gray-400 line-through"}>{em.email}</span>
            <div className="flex gap-2 text-xs">
              <button onClick={() => toggle(em)} className="rounded-lg bg-gray-100 px-3 py-1.5 font-semibold">
                {em.is_active ? "ปิด" : "เปิด"}
              </button>
              <button onClick={() => remove(em.id)} className="rounded-lg bg-red-50 px-3 py-1.5 font-semibold text-red-700">
                ลบ
              </button>
            </div>
          </div>
        ))}
        {emails.length === 0 && <p className="rounded-xl bg-white p-4 text-center text-sm text-gray-400 shadow-sm">ยังไม่มีอีเมลเพิ่มเติม</p>}
      </div>

      <h2 className="mt-6 font-bold">ประวัติการส่งอีเมล (ล่าสุด)</h2>
      <div className="mt-2 space-y-1">
        {logs.map((l) => (
          <div key={l.id} className="rounded-xl bg-white px-4 py-2.5 text-sm shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-semibold">{EMAIL_EVENT_LABEL[l.event_type]}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  l.send_status === "sent" ? "bg-green-100 text-green-700" : l.send_status === "failed" ? "bg-red-100 text-red-700" : "bg-gray-200 text-gray-600"
                }`}
              >
                {l.send_status}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-gray-500">
              {new Date(l.sent_at).toLocaleString("th-TH")} • ถึง {l.recipients.length > 0 ? l.recipients.join(", ") : "—"}
              {l.note ? ` • ${l.note}` : ""}
            </p>
          </div>
        ))}
        {logs.length === 0 && <p className="rounded-xl bg-white p-4 text-center text-sm text-gray-400 shadow-sm">ยังไม่มีประวัติ</p>}
      </div>
    </div>
  );
}
