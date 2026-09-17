"use client";

import { useRouter } from "next/navigation";
import type { SessionUser } from "@/lib/auth";
import { ROLE_LABEL } from "@/lib/auth";

export function AppShell({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const links: Array<{ href: string; label: string; roles: SessionUser["role"][] }> = [
    { href: "/dashboard", label: "Dashboard", roles: ["user", "purchaser", "admin"] },
    { href: "/supply", label: "Supply", roles: ["user", "purchaser", "admin"] },
    { href: "/issue", label: "เบิกของ", roles: ["user", "purchaser", "admin"] },
    { href: "/orders", label: "สั่งซื้อค้างรับ", roles: ["purchaser", "admin"] },
    { href: "/history", label: "ประวัติ", roles: ["user", "purchaser", "admin"] },
    { href: "/users", label: "ผู้ใช้ (Admin)", roles: ["admin"] },
    { href: "/notifications", label: "ตั้งค่าการแจ้งเตือน (Admin)", roles: ["admin"] }
  ];

  return (
    <div className="min-h-screen md:flex">
      <aside className="hidden w-64 shrink-0 bg-slate-900 p-4 text-white md:block">
        <h2 className="text-lg font-bold">SupplyStock</h2>
        <p className="mt-1 text-xs text-slate-300">
          {user.name} • {ROLE_LABEL[user.role]}
        </p>
        <nav className="mt-6 space-y-1">
          {links
            .filter((l) => l.roles.includes(user.role))
            .map((l) => (
              <a key={l.href} href={l.href} className="block rounded-lg px-3 py-2 text-sm hover:bg-slate-700">
                {l.label}
              </a>
            ))}
        </nav>
        <button onClick={logout} className="mt-8 w-full rounded-lg bg-slate-700 px-3 py-2 text-sm">
          Logout
        </button>
      </aside>

      <div className="flex-1">
        <header className="flex items-center justify-between bg-white px-4 py-3 shadow-sm md:hidden">
          <span className="font-bold">SupplyStock</span>
          <button onClick={logout} className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm">
            Logout
          </button>
        </header>
        <nav className="flex gap-2 overflow-x-auto bg-white px-4 py-2 text-sm md:hidden">
          {links
            .filter((l) => l.roles.includes(user.role))
            .map((l) => (
              <a key={l.href} href={l.href} className="whitespace-nowrap rounded-full bg-gray-100 px-3 py-1.5">
                {l.label}
              </a>
            ))}
        </nav>
        <main className="mx-auto w-full max-w-4xl p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
