import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import SupplyList from "@/components/SupplyList";
import { readSupplies } from "@/lib/store";

export default function SupplyPage() {
  const user = getSession();
  if (!user) redirect("/login");
  const supplies = readSupplies();

  return (
    <AppShell user={user}>
      <SupplyList user={user} supplies={supplies} />
    </AppShell>
  );
}
