import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import ReceiveForm from "@/components/ReceiveForm";
import { findOrder, findSupply, isOverdue } from "@/lib/store";

export default function ReceivePage({ params }: { params: { id: string } }) {
  const user = getSession();
  if (!user) redirect("/login");
  if (user.role !== "purchaser" && user.role !== "admin") redirect("/no-access");
  const order = findOrder(params.id);
  if (!order) notFound();
  if (order.received_status === "received") redirect("/orders");
  const supply = findSupply(order.supply_id);

  return (
    <AppShell user={user}>
      <a href="/orders" className="text-sm text-blue-700">← กลับรายการค้างรับ</a>
      <h1 className="mt-1 text-xl font-bold">รับของเข้า: {supply?.item_name ?? "(ถูกลบ)"}</h1>
      {supply?.image_url && (
        <img src={supply.image_url} alt={supply.item_name} className="mt-3 max-h-48 w-full rounded-xl border object-contain bg-white" />
      )}
      <p className="mt-1 text-sm text-gray-600">
        สั่ง {order.ordered_qty} {supply?.unit ?? ""} • คาดเข้า {order.expected_arrival_date}
        {isOverdue(order) && <span className="ml-1 font-semibold text-red-700">(เกินกำหนด)</span>}
      </p>
      <ReceiveForm orderId={order.id} unit={supply?.unit ?? "ชิ้น"} orderedQty={order.ordered_qty} />
    </AppShell>
  );
}
