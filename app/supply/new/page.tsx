import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import SupplyForm from "@/components/SupplyForm";

export default function NewSupplyPage() {
  const user = getSession();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/no-access");

  return (
    <AppShell user={user}>
      <a href="/supply" className="text-sm text-blue-700">← กลับรายการ Supply</a>
      <h1 className="mt-1 text-xl font-bold">เพิ่มรายการ Supply</h1>
      <SupplyForm />
    </AppShell>
  );
}
