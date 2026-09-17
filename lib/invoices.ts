import fs from "fs";
import path from "path";

// เก็บรูปแบบ local (public/uploads) สำหรับเวอร์ชันแรก
// เมื่อย้ายไป Supabase Storage ให้เปลี่ยนแค่ saveUploadImage นี้ (return public URL แทน)

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_BYTES = 5 * 1024 * 1024; // 5MB

export async function saveUploadImage(
  file: File | null,
  prefix: string,
  opts?: { required?: boolean; requiredMessage?: string }
): Promise<{ ok: boolean; url?: string; error?: string }> {
  if (!file || file.size === 0) {
    if (opts?.required === false) return { ok: true, url: undefined };
    return { ok: false, error: opts?.requiredMessage || "กรุณาแนบรูปภาพ" };
  }
  if (!file.type.startsWith("image/")) return { ok: false, error: "ไฟล์ต้องเป็นรูปภาพเท่านั้น" };
  if (file.size > MAX_BYTES) return { ok: false, error: "รูปต้องไม่เกิน 5MB" };

  const rawExt = (file.type.split("/")[1] || "jpg").split("+")[0].replace(/[^a-z0-9]/gi, "");
  const ext = rawExt || "jpg";
  const name = `${prefix}-${Date.now().toString(36)}.${ext}`;

  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const buf = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(path.join(UPLOAD_DIR, name), buf);

  return { ok: true, url: `/uploads/${name}` };
}

export async function saveInvoice(
  file: File | null,
  orderId: string
): Promise<{ ok: boolean; url?: string; error?: string }> {
  return saveUploadImage(file, orderId, { requiredMessage: "กรุณาแนบรูป invoice" });
}

export function deleteUpload(url: string | null | undefined) {
  if (!url || !url.startsWith("/uploads/")) return;
  const name = url.slice("/uploads/".length);
  if (!/^[\w.\-]+$/.test(name)) return;
  try {
    fs.unlinkSync(path.join(UPLOAD_DIR, name));
  } catch {
    // ไม่มีไฟล์ก็ไม่เป็นไร
  }
}
