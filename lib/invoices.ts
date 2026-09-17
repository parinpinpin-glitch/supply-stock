import { sb } from "@/lib/supabase";

// เก็บรูปใน Supabase Storage bucket "uploads" (public)
// URL ที่ได้เป็น public URL เต็ม — ใช้กับ <img> ได้เลย

const BUCKET = "uploads";
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
  const safePrefix = prefix.replace(/[^a-z0-9_-]/gi, "").slice(0, 24) || "img";
  const name = `${safePrefix}-${Date.now().toString(36)}.${ext}`;

  const { error } = await sb().storage.from(BUCKET).upload(name, file, { contentType: file.type });
  if (error) return { ok: false, error: "อัปโหลดรูปไม่สำเร็จ: " + error.message };

  const { data } = sb().storage.from(BUCKET).getPublicUrl(name);
  return { ok: true, url: data.publicUrl };
}

export async function saveInvoice(
  file: File | null,
  orderId: string
): Promise<{ ok: boolean; url?: string; error?: string }> {
  return saveUploadImage(file, orderId, { requiredMessage: "กรุณาแนบรูป invoice" });
}

export async function deleteUpload(url: string | null | undefined) {
  if (!url) return;
  // รองรับทั้ง public URL ของ Supabase และ path local เดิม (/uploads/x)
  const m = url.match(/\/uploads\/([\w.\-]+)$/);
  if (!m) return;
  await sb().storage.from(BUCKET).remove([m[1]]);
}
