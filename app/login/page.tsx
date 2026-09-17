"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@demo.local");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "เข้าสู่ระบบไม่สำเร็จ");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("เชื่อมต่อไม่ได้ กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6">
      <div className="rounded-2xl bg-white p-6 shadow">
        <h1 className="text-2xl font-bold">SupplyStock</h1>
        <p className="mt-1 text-sm text-gray-600">เว็บจัดการ Supply — Phase 1: Login + สิทธิ์พื้นฐาน</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="email">
              อีเมล
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border px-3 py-2.5"
              placeholder="you@company.local"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="password">
              รหัสผ่าน
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border px-3 py-2.5"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white disabled:opacity-60"
          >
            {loading ? "กำลังเข้าสู่ระบบ…" : "Login"}
          </button>
        </form>

        <div className="mt-6 rounded-lg bg-gray-50 p-3 text-xs leading-6 text-gray-700">
          <p className="font-semibold">บัญชีทดสอบ:</p>
          <p>ผู้ใช้: user@demo.local / password123</p>
          <p>ผู้ซื้อ: purchaser@demo.local / password123</p>
          <p>Admin: admin@demo.local / password123</p>
        </div>
      </div>
    </main>
  );
}
