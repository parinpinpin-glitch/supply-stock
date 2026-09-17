import type { Supply } from "@/lib/store";

// ใช้ได้ทั้ง server + client (ไม่มี hook)
export function stockBadge(s: Supply) {
  if (!s.is_active)
    return <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs">ปิดใช้งาน</span>;
  if (s.current_stock <= s.reorder_point)
    return (
      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
        ต้องสั่งซื้อ
      </span>
    );
  return <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">ปกติ</span>;
}

// รูป thumbnail ของ item (ไม่มีรูป = กล่องสีเทา)
export function supplyThumb(url: string | null | undefined, size = "h-12 w-12") {
  if (!url) {
    return (
      <span className={`flex shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400 ${size}`}>
        📦
      </span>
    );
  }
  return <img src={url} alt="" className={`shrink-0 rounded-lg border object-cover ${size}`} />;
}
