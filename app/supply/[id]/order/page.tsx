import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import OrderForm from "@/components/OrderForm";
import { findSupply } from "@/lib/store";

export default async function SupplyOrderPage({ params }: { params: { id: string } }) {
  const user = getSession();
  if (!user) redirect("/login");
  if (user.role !== "purchaser" && user.role !== "admin") redirect("/no-access");
  const supply = await findSupply(params.id);
  if (!supply) notFound();

  return (
    <AppShell user={user}>
      <a href={`/supply/${supply.id}`} className="text-sm text-blue-700">← กลับ {supply.item_name}</a>
      <h1 className="mt-1 text-xl font-bold">สั่งซื้อแล้ว: {supply.item_name}</h1>
      {supply.image_url && (
        <img src={supply.image_url} alt={supply.item_name} className="mt-3 max-h-48 w-full rounded-xl border object-contain bg-white" />
      )}
      <p className="mt-1 text-sm text-gray-600">
        stock ปัจจุบัน {supply.current_stock} {supply.unit} • ROP {supply.reorder_point}
      </p>
      <OrderForm supplyId={supply.id} unit={supply.unit} />
    </AppShell>
  );
}
