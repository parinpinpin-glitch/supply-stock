// ย้ายข้อมูล local (data/db.json + public/uploads) ขึ้น Supabase — รันครั้งเดียว
//   npm run migrate
// ข้าม record ที่มีอยู่แล้ว (upsert ตาม id), อัปโหลดไฟล์รูปแล้วแก้ URL เป็น public URL
import fs from "fs";
import path from "path";
import { client, publicUrl, ROOT } from "./sbutil.mjs";

const sb = client();
const dbPath = path.join(ROOT, "data", "db.json");
if (!fs.existsSync(dbPath)) {
  console.log("ไม่พบ data/db.json — ข้าม (ใช้ npm run seed แทนถ้าต้องการข้อมูลเริ่มต้น)");
  process.exit(0);
}
const db = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
const BUCKET = "uploads";

async function uploadLocal(localUrl) {
  if (!localUrl || !localUrl.startsWith("/uploads/")) return localUrl;
  const name = localUrl.slice("/uploads/".length);
  if (!/^[\w.\-]+$/.test(name)) return localUrl;
  const fp = path.join(ROOT, "public", "uploads", name);
  if (!fs.existsSync(fp)) {
    console.log("  skip missing file: " + name);
    return null;
  }
  const buf = fs.readFileSync(fp);
  const ext = (name.split(".").pop() || "jpg").toLowerCase();
  const type = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
  const { error } = await sb.storage.from(BUCKET).upload(name, buf, { contentType: type, upsert: true });
  if (error) throw new Error("upload " + name + ": " + error.message);
  return publicUrl(sb, BUCKET, name);
}

async function upsertAll(table, rows, label) {
  if (!rows || rows.length === 0) {
    console.log(`${label}: 0 (ข้าม)`);
    return;
  }
  const { error } = await sb.from(table).upsert(rows, { onConflict: "id" });
  if (error) throw new Error(`upsert ${label}: ` + error.message);
  console.log(`${label}: ${rows.length}`);
}

// 1. supplies (+อัปโหลดรูป item)
const supplies = [];
for (const s of db.supplies ?? []) {
  supplies.push({ ...s, image_url: await uploadLocal(s.image_url) });
}
await upsertAll("supplies", supplies, "supplies");

// 2. users / extra_emails / movements / email_logs (ตรงๆ)
await upsertAll("app_users", db.users ?? [], "app_users");
await upsertAll("extra_emails", db.extra_emails ?? [], "extra_emails");
await upsertAll("stock_movements", db.movements ?? [], "stock_movements");
await upsertAll("email_logs", db.email_logs ?? [], "email_logs");

// 3. orders (+อัปโหลด invoice)
const orders = [];
for (const o of db.orders ?? []) {
  orders.push({ ...o, invoice_image_url: await uploadLocal(o.invoice_image_url) });
}
await upsertAll("purchase_orders", orders, "purchase_orders");

console.log("migrate ok");
