"use client";

import { useState } from "react";
import type { SafeUser } from "@/lib/store";
import type { UserRole } from "@/lib/auth";
import { ROLE_LABEL } from "@/lib/auth";

const ROLES: UserRole[] = ["user", "purchaser", "admin"];

export default function UsersManager({ initial, selfId }: { initial: SafeUser[]; selfId: string }) {
  const [users, setUsers] = useState(initial);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "user" as UserRole });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetId, setResetId] = useState("");
  const [newPass, setNewPass] = useState("");

  async function refresh() {
    const r = await fetch("/api/users");
    const d = await r.json();
    if (r.ok) setUsers(d.users);
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const r = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const d = await r.json();
      if (!r.ok) {
        setError(d?.error ?? "เพิ่มไม่สำเร็จ");
        return;
      }
      setForm({ name: "", email: "", password: "", role: "user" });
      await refresh();
    } finally {
      setLoading(false);
    }
  }

  async function patch(id: string, body: object, confirmMsg?: string) {
    if (confirmMsg && !confirm(confirmMsg)) return;
    setError("");
    const r = await fetch(`/api/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const d = await r.json();
    if (!r.ok) {
      setError(d?.error ?? "บันทึกไม่สำเร็จ");
      return;
    }
    await refresh();
  }

  async function remove(id: string) {
    setError("");
    const r = await fetch(`/api/users/${id}`, { method: "DELETE" });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      setError(d?.error ?? "ลบไม่สำเร็จ");
      return;
    }
    await refresh();
  }

  async function resetPassword(id: string) {
    if (newPass.length < 6) {
      setError("รหัสผ่านใหม่ต้องยาวอย่างน้อย 6 ตัวอักษร");
      return;
    }
    await patch(id, { password: newPass });
    setResetId("");
    setNewPass("");
  }

  return (
    <div>
      {/* เพิ่มผู้ใช้ */}
      <form onSubmit={add} className="mt-4 space-y-3 rounded-xl bg-white p-4 shadow-sm">
        <p className="font-semibold">เพิ่มผู้ใช้</p>
        <div className="grid grid-cols-2 gap-3">
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="ชื่อ" className="rounded-lg border px-3 py-2.5" />
          <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="อีเมล" className="rounded-lg border px-3 py-2.5" />
          <input required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="รหัสผ่าน (≥6 ตัว)" className="rounded-lg border px-3 py-2.5" />
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })} className="rounded-lg border px-3 py-2.5">
            {ROLES.map((r) => (
              <option key={r} value={r}>{ROLE_LABEL[r]}</option>
            ))}
          </select>
        </div>
        <button disabled={loading} className="w-full rounded-lg bg-blue-700 px-4 py-2.5 font-semibold text-white disabled:opacity-60">
          {loading ? "กำลังเพิ่ม…" : "เพิ่มผู้ใช้"}
        </button>
      </form>

      {error && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {/* รายชื่อ */}
      <div className="mt-4 space-y-2">
        {users.map((u) => {
          const isSelf = u.id === selfId;
          return (
            <div key={u.id} className="rounded-xl bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">
                    {u.name} {isSelf && <span className="text-xs font-normal text-gray-400">(คุณ)</span>}
                  </p>
                  <p className="text-xs text-gray-500">{u.email}</p>
                </div>
                {!u.is_active && (
                  <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs">ปิดใช้งาน</span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <select
                  value={u.role}
                  disabled={isSelf}
                  onChange={(e) => patch(u.id, { role: e.target.value })}
                  className="rounded-lg border px-2 py-1.5"
                  title="บทบาท"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                  ))}
                </select>
                {!isSelf && (
                  <>
                    <button onClick={() => patch(u.id, { is_active: !u.is_active })} className="rounded-lg bg-gray-100 px-3 py-1.5 font-semibold">
                      {u.is_active ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                    </button>
                    <button onClick={() => (resetId === u.id ? setResetId("") : (setResetId(u.id), setNewPass("")))} className="rounded-lg bg-gray-100 px-3 py-1.5 font-semibold">
                      ตั้งรหัสใหม่
                    </button>
                    <button onClick={() => confirm(`ลบ ${u.email}? ประวัติที่เคยทำไว้ยังอยู่`) && remove(u.id)} className="rounded-lg bg-red-50 px-3 py-1.5 font-semibold text-red-700">
                      ลบ
                    </button>
                  </>
                )}
              </div>
              {resetId === u.id && (
                <div className="mt-2 flex gap-2">
                  <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="รหัสใหม่ (≥6 ตัว)" className="flex-1 rounded-lg border px-3 py-1.5 text-sm" />
                  <button onClick={() => resetPassword(u.id)} className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white">
                    บันทึก
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-gray-500">หมายเหตุ: เปลี่ยนสิทธิ์คนอื่นแล้วต้องให้เขา login ใหม่ / ประวัติที่เคยทำไว้ไม่หายเมื่อลบ user</p>
    </div>
  );
}
