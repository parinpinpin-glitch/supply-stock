// ใช้ร่วมกันของ scripts/ — โหลด env จาก .env.local + สร้าง service client
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const here = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.join(here, "..");

export function loadEnv() {
  const p = path.join(ROOT, ".env.local");
  if (!fs.existsSync(p)) throw new Error("ไม่พบ .env.local");
  for (const line of fs.readFileSync(p, "utf-8").split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

export function client() {
  loadEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("ขาด env Supabase");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function publicUrl(sb, bucket, name) {
  return sb.storage.from(bucket).getPublicUrl(name).data.publicUrl;
}
