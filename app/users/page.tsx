import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import UsersManager from "@/components/UsersManager";
import { listUsers } from "@/lib/store";

export default async function UsersPage() {
  const user = getSession();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/no-access");

  const users = await listUsers();
  return (
    <AppShell user={user}>
      <h1 className="text-xl font-bold">ผู้ใช้ ({users.length})</h1>
      <p className="mt-1 text-sm text-gray-600">Admin เพิ่ม/เปลี่ยนสิทธิ์/เปิด-ปิด/ลบ user ได้ที่นี่</p>
      <UsersManager initial={users} selfId={user.id} />
    </AppShell>
  );
}
