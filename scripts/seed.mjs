// seed ข้อมูลเริ่มต้น (รันครั้งเดียวหลังสร้าง tables)
//   npm run seed
import { client } from "./sbutil.mjs";

const sb = client();
const now = new Date().toISOString();

const users = [
  { id: "u-user-1", email: "user@demo.local", name: "ผู้ใช้ทดสอบ", password: "password123", role: "user", is_active: true, created_at: now },
  { id: "u-purchaser-1", email: "purchaser@demo.local", name: "ผู้ซื้อทดสอบ", password: "password123", role: "purchaser", is_active: true, created_at: now },
  { id: "u-admin-1", email: "admin@demo.local", name: "แอดมินทดสอบ", password: "password123", role: "admin", is_active: true, created_at: now }
];

const supplies = [
  { id: "seed-a4-80", item_name: "กระดาษ A4 80 แกรม", item_code_or_short_name: "A4-80", supplier_name: "Siam Paper", current_stock: 120, unit: "รีม", reorder_point: 20, lead_time_days: 7, last_purchase_date: null, image_url: null, is_active: true, created_at: now, updated_at: now },
  { id: "seed-ink-680", item_name: "หมึกพิมพ์ HP 680 สีดำ", item_code_or_short_name: "INK-680BK", supplier_name: "HP Center", current_stock: 5, unit: "ตลับ", reorder_point: 10, lead_time_days: 14, last_purchase_date: null, image_url: null, is_active: true, created_at: now, updated_at: now }
];

for (const u of users) {
  const { error } = await sb.from("app_users").upsert(u, { onConflict: "id" });
  if (error) throw new Error("seed users: " + error.message);
}
for (const s of supplies) {
  const { error } = await sb.from("supplies").upsert(s, { onConflict: "id" });
  if (error) throw new Error("seed supplies: " + error.message);
}
console.log("seed ok: 3 users + 2 supplies");
