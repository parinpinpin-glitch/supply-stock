import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import IssueForm from "@/components/IssueForm";
import { readSupplies } from "@/lib/store";

export default function IssuePage() {
  const user = getSession();
  if (!user) redirect("/login");
  const supplies = readSupplies().filter((s) => s.is_active);

  return (
    <AppShell user={user}>
      <h1 className="text-xl font-bold">เบิกของ</h1>
      <p className="mt-1 text-sm text-gray-600">เลือก item → ใส่จำนวน → กดเบิก stock ลดทันที</p>
      {supplies.length === 0 ? (
        <div className="mt-4 rounded-xl bg-white p-6 text-center text-sm text-gray-500 shadow-sm">
          ยังไม่มีรายการ Supply
        </div>
      ) : (
        <IssueForm supplies={supplies} />
      )}
    </AppShell>
  );
}
