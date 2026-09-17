import { Resend } from "resend";
import { listExtraEmails, logEmail, type EmailEventType } from "@/lib/store";

// ส่งอีเมลผ่าน Resend — ถ้ายังไม่มี RESEND_API_KEY หรือไม่มีผู้รับ จะบันทึก log เป็น skipped
// ผู้รับ = อีเมลเพิ่มเติมที่ Admin เพิ่มไว้ (เวอร์ชันแรก)

function resendClient() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export async function getRecipients(): Promise<string[]> {
  return (await listExtraEmails()).filter((e) => e.is_active).map((e) => e.email);
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function notify(
  event: EmailEventType,
  subject: string,
  html: string,
  related: { supply_id?: string | null; order_id?: string | null }
) {
  const recipients = await getRecipients();
  if (recipients.length === 0) {
    return await logEmail({
      event_type: event,
      related_supply_id: related.supply_id ?? null,
      related_purchase_order_id: related.order_id ?? null,
      recipients: [],
      send_status: "skipped",
      note: "ไม่มีอีเมลผู้รับ (เพิ่มได้ที่หน้า ตั้งค่าการแจ้งเตือน)"
    });
  }
  const client = resendClient();
  if (!client) {
    return logEmail({
      event_type: event,
      related_supply_id: related.supply_id ?? null,
      related_purchase_order_id: related.order_id ?? null,
      recipients,
      send_status: "skipped",
      note: "ยังไม่ได้ตั้งค่า RESEND_API_KEY"
    });
  }
  try {
    await client.emails.send({
      from: process.env.EMAIL_FROM || "SupplyStock <onboarding@resend.dev>",
      to: recipients,
      subject,
      html
    });
    return logEmail({
      event_type: event,
      related_supply_id: related.supply_id ?? null,
      related_purchase_order_id: related.order_id ?? null,
      recipients,
      send_status: "sent",
      note: ""
    });
  } catch (e) {
    return logEmail({
      event_type: event,
      related_supply_id: related.supply_id ?? null,
      related_purchase_order_id: related.order_id ?? null,
      recipients,
      send_status: "failed",
      note: e instanceof Error ? e.message.slice(0, 300) : "send failed"
    });
  }
}
