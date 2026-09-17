import { sb } from "@/lib/supabase";
import type { UserRole } from "@/lib/auth";

// ชั้นเก็บข้อมูล: Supabase (tables ตรง supabase/001_init.sql v2)
// ทุกฟังก์ชันอ่าน/เขียนเป็น async — เรียกด้วย await จาก server (API routes / pages) เท่านั้น

const nid = (p: string) => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const nowISO = () => new Date().toISOString();

// --- Supplies ---

export type Supply = {
  id: string;
  item_name: string;
  item_code_or_short_name: string;
  supplier_name: string;
  current_stock: number;
  unit: string;
  reorder_point: number;
  lead_time_days: number;
  last_purchase_date: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

function rowToSupply(r: any): Supply {
  return {
    id: String(r.id),
    item_name: r.item_name ?? "",
    item_code_or_short_name: r.item_code_or_short_name ?? "",
    supplier_name: r.supplier_name ?? "",
    current_stock: Number(r.current_stock ?? 0),
    unit: r.unit ?? "ชิ้น",
    reorder_point: Number(r.reorder_point ?? 0),
    lead_time_days: Number(r.lead_time_days ?? 0),
    last_purchase_date: r.last_purchase_date ?? null,
    image_url: r.image_url ?? null,
    is_active: r.is_active !== false,
    created_at: r.created_at,
    updated_at: r.updated_at
  };
}

export async function readSupplies(): Promise<Supply[]> {
  const { data, error } = await sb().from("supplies").select("*").order("created_at", { ascending: true });
  if (error) throw new Error("read supplies: " + error.message);
  return (data ?? []).map(rowToSupply);
}

export async function findSupply(id: string): Promise<Supply | undefined> {
  const { data, error } = await sb().from("supplies").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error("find supply: " + error.message);
  return data ? rowToSupply(data) : undefined;
}

export type SupplyInput = {
  item_name: string;
  item_code_or_short_name: string;
  supplier_name: string;
  current_stock: number;
  unit: string;
  reorder_point: number;
  lead_time_days: number;
  is_active: boolean;
};

// ตรวจ input ตรงกติกา PRODUCT.md (จำนวนห้ามติดลบ, ชื่อห้ามว่าง)
export function validateSupplyInput(body: any): { ok: boolean; error?: string; value?: SupplyInput } {
  const item_name = String(body?.item_name ?? "").trim();
  if (!item_name) return { ok: false, error: "กรุณากรอกชื่อรายการ" };

  const num = (v: any): number | null => {
    if (v === "" || v === null || v === undefined) return null;
    const n = Number(v);
    if (!Number.isFinite(n)) return NaN as unknown as null;
    return n;
  };

  const current_stock = num(body?.current_stock);
  if (current_stock === null || current_stock === undefined || Number.isNaN(current_stock as number))
    return { ok: false, error: "จำนวนคงเหลือต้องเป็นตัวเลข" };
  if ((current_stock as number) < 0) return { ok: false, error: "จำนวนคงเหลือห้ามติดลบ" };

  const reorder_point = num(body?.reorder_point);
  if (reorder_point === null || reorder_point === undefined || Number.isNaN(reorder_point as number))
    return { ok: false, error: "ROP ต้องเป็นตัวเลข" };
  if ((reorder_point as number) < 0) return { ok: false, error: "ROP ห้ามติดลบ" };

  const leadRaw = num(body?.lead_time_days);
  if (leadRaw === null || leadRaw === undefined || Number.isNaN(leadRaw as number))
    return { ok: false, error: "Lead time ต้องเป็นตัวเลข" };
  const lead_time_days = Math.trunc(leadRaw as number);
  if (lead_time_days < 0) return { ok: false, error: "Lead time ห้ามติดลบ" };

  const unit = String(body?.unit ?? "").trim() || "ชิ้น";

  return {
    ok: true,
    value: {
      item_name,
      item_code_or_short_name: String(body?.item_code_or_short_name ?? "").trim(),
      supplier_name: String(body?.supplier_name ?? "").trim(),
      current_stock: current_stock as number,
      unit,
      reorder_point: reorder_point as number,
      lead_time_days,
      is_active: body?.is_active === false ? false : true
    }
  };
}

export async function createSupply(value: SupplyInput): Promise<Supply> {
  const row = {
    id: nid("s"),
    ...value,
    last_purchase_date: null,
    image_url: null,
    created_at: nowISO(),
    updated_at: nowISO()
  };
  const { data, error } = await sb().from("supplies").insert(row).select().single();
  if (error) throw new Error("create supply: " + error.message);
  return rowToSupply(data);
}

export async function updateSupply(id: string, patch: Partial<Supply>): Promise<Supply | undefined> {
  const { data, error } = await sb()
    .from("supplies")
    .update({ ...patch, updated_at: nowISO() })
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw new Error("update supply: " + error.message);
  return data ? rowToSupply(data) : undefined;
}

export async function setSupplyImage(id: string, image_url: string | null): Promise<Supply | undefined> {
  return updateSupply(id, { image_url });
}

export function isLowStock(s: Supply) {
  return s.current_stock <= s.reorder_point;
}

// --- Stock movements ---

export type MovementType = "issue" | "order_marked" | "receive" | "adjust";

export type Movement = {
  id: string;
  supply_id: string;
  movement_type: MovementType;
  qty: number;
  performed_by_user_id: string;
  performed_by_name: string;
  performed_at: string;
  reference_purchase_order_id: string | null;
  notes: string;
};

function rowToMovement(r: any): Movement {
  return {
    id: String(r.id),
    supply_id: r.supply_id,
    movement_type: r.movement_type,
    qty: Number(r.qty),
    performed_by_user_id: r.performed_by_user_id ?? "",
    performed_by_name: r.performed_by_name ?? "",
    performed_at: r.performed_at,
    reference_purchase_order_id: r.reference_purchase_order_id ?? null,
    notes: r.notes ?? ""
  };
}

export async function readMovements(limit = 500): Promise<Movement[]> {
  const { data, error } = await sb()
    .from("stock_movements")
    .select("*")
    .order("performed_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error("read movements: " + error.message);
  return (data ?? []).map(rowToMovement);
}

export async function addMovement(m: Omit<Movement, "id">): Promise<Movement> {
  const { data, error } = await sb()
    .from("stock_movements")
    .insert({ ...m, id: nid("m") })
    .select()
    .single();
  if (error) throw new Error("add movement: " + error.message);
  return rowToMovement(data);
}

export async function movementsForSupply(supplyId: string, limit = 10): Promise<Movement[]> {
  const { data, error } = await sb()
    .from("stock_movements")
    .select("*")
    .eq("supply_id", supplyId)
    .order("performed_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error("movements for supply: " + error.message);
  return (data ?? []).map(rowToMovement);
}

export const MOVEMENT_LABEL: Record<MovementType, string> = {
  issue: "เบิกของ",
  order_marked: "สั่งซื้อแล้ว",
  receive: "รับของเข้า",
  adjust: "ปรับ stock"
};

// --- Purchase orders ---

export type ReceivedStatus = "pending" | "received";

export type PurchaseOrder = {
  id: string;
  supply_id: string;
  ordered_qty: number;
  ordered_by_user_id: string;
  ordered_by_name: string;
  ordered_at: string;
  expected_arrival_date: string; // YYYY-MM-DD
  received_status: ReceivedStatus;
  received_at: string | null;
  received_qty: number | null;
  invoice_image_url: string | null;
  notes: string;
};

function rowToOrder(r: any): PurchaseOrder {
  return {
    id: String(r.id),
    supply_id: r.supply_id,
    ordered_qty: Number(r.ordered_qty),
    ordered_by_user_id: r.ordered_by_user_id ?? "",
    ordered_by_name: r.ordered_by_name ?? "",
    ordered_at: r.ordered_at,
    expected_arrival_date: r.expected_arrival_date,
    received_status: r.received_status,
    received_at: r.received_at ?? null,
    received_qty: r.received_qty === null || r.received_qty === undefined ? null : Number(r.received_qty),
    invoice_image_url: r.invoice_image_url ?? null,
    notes: r.notes ?? ""
  };
}

export async function listOrders(filter?: {
  status?: ReceivedStatus | "overdue";
  supply_id?: string;
}): Promise<PurchaseOrder[]> {
  let q = sb().from("purchase_orders").select("*").order("ordered_at", { ascending: false });
  if (filter?.supply_id) q = q.eq("supply_id", filter.supply_id);
  if (filter?.status === "overdue") {
    q = q.eq("received_status", "pending");
    const { data, error } = await q;
    if (error) throw new Error("list orders: " + error.message);
    return (data ?? []).map(rowToOrder).filter((o) => isOverdue(o));
  }
  if (filter?.status) q = q.eq("received_status", filter.status);
  const { data, error } = await q;
  if (error) throw new Error("list orders: " + error.message);
  return (data ?? []).map(rowToOrder);
}

export async function findOrder(id: string): Promise<PurchaseOrder | undefined> {
  const { data, error } = await sb().from("purchase_orders").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error("find order: " + error.message);
  return data ? rowToOrder(data) : undefined;
}

export async function createOrder(o: Omit<PurchaseOrder, "id">): Promise<PurchaseOrder> {
  const { data, error } = await sb()
    .from("purchase_orders")
    .insert({ ...o, id: nid("po") })
    .select()
    .single();
  if (error) throw new Error("create order: " + error.message);
  return rowToOrder(data);
}

export async function updateOrder(id: string, patch: Partial<PurchaseOrder>): Promise<PurchaseOrder | undefined> {
  const { data, error } = await sb().from("purchase_orders").update(patch).eq("id", id).select().maybeSingle();
  if (error) throw new Error("update order: " + error.message);
  return data ? rowToOrder(data) : undefined;
}

// overdue = ยังไม่รับ + ถึง/past expected date (เทียบวันที่แบบ local, ไม่เอาเวลา)
export function isOverdue(o: PurchaseOrder, today = new Date()): boolean {
  if (o.received_status !== "pending") return false;
  const d = new Date(o.expected_arrival_date + "T00:00:00");
  if (Number.isNaN(d.getTime())) return false;
  const t = new Date(today);
  t.setHours(0, 0, 0, 0);
  return d.getTime() <= t.getTime();
}

export function todayISO(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

// --- Extra notification emails ---

export type ExtraEmail = {
  id: string;
  email: string;
  is_active: boolean;
  created_at: string;
};

function rowToExtraEmail(r: any): ExtraEmail {
  return { id: String(r.id), email: r.email, is_active: r.is_active !== false, created_at: r.created_at };
}

export async function listExtraEmails(): Promise<ExtraEmail[]> {
  const { data, error } = await sb().from("extra_emails").select("*").order("created_at", { ascending: true });
  if (error) throw new Error("list emails: " + error.message);
  return (data ?? []).map(rowToExtraEmail);
}

export async function addExtraEmail(email: string): Promise<ExtraEmail | { error: string }> {
  const clean = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) return { error: "รูปแบบอีเมลไม่ถูกต้อง" };
  const { data, error } = await sb()
    .from("extra_emails")
    .insert({ id: nid("em"), email: clean, is_active: true, created_at: nowISO() })
    .select()
    .single();
  if (error) {
    if (error.code === "23505") return { error: "อีเมลนี้มีอยู่แล้ว" };
    throw new Error("add email: " + error.message);
  }
  return rowToExtraEmail(data);
}

export async function setExtraEmailActive(id: string, is_active: boolean): Promise<ExtraEmail | undefined> {
  const { data, error } = await sb().from("extra_emails").update({ is_active }).eq("id", id).select().maybeSingle();
  if (error) throw new Error("update email: " + error.message);
  return data ? rowToExtraEmail(data) : undefined;
}

export async function deleteExtraEmail(id: string): Promise<boolean> {
  const { count, error } = await sb().from("extra_emails").delete({ count: "exact" }).eq("id", id);
  if (error) throw new Error("delete email: " + error.message);
  return (count ?? 0) > 0;
}

// --- Email logs ---

export type EmailEventType = "low_stock" | "overdue_arrival" | "received";
export type EmailSendStatus = "sent" | "failed" | "skipped";

export type EmailLog = {
  id: string;
  event_type: EmailEventType;
  related_supply_id: string | null;
  related_purchase_order_id: string | null;
  recipients: string[];
  sent_at: string;
  send_status: EmailSendStatus;
  note: string;
};

function rowToEmailLog(r: any): EmailLog {
  return {
    id: String(r.id),
    event_type: r.event_type,
    related_supply_id: r.related_supply_id ?? null,
    related_purchase_order_id: r.related_purchase_order_id ?? null,
    recipients: r.recipients ?? [],
    sent_at: r.sent_at,
    send_status: r.send_status,
    note: r.note ?? ""
  };
}

export async function listEmailLogs(limit = 20): Promise<EmailLog[]> {
  const { data, error } = await sb()
    .from("email_logs")
    .select("*")
    .order("sent_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error("list email logs: " + error.message);
  return (data ?? []).map(rowToEmailLog);
}

export async function logEmail(log: Omit<EmailLog, "id" | "sent_at">): Promise<EmailLog> {
  const { data, error } = await sb()
    .from("email_logs")
    .insert({ ...log, id: nid("el"), sent_at: nowISO() })
    .select()
    .single();
  if (error) throw new Error("log email: " + error.message);
  return rowToEmailLog(data);
}

// เคยแจ้ง overdue ของ order นี้แล้วหรือยัง (กันส่งซ้ำ)
export async function overdueNotified(orderId: string): Promise<boolean> {
  const { data, error } = await sb()
    .from("email_logs")
    .select("id")
    .eq("event_type", "overdue_arrival")
    .eq("related_purchase_order_id", orderId)
    .limit(1);
  if (error) throw new Error("overdue notified: " + error.message);
  return (data ?? []).length > 0;
}

// --- Users (demo auth; ย้ายไป Supabase Auth ในอนาคต) ---

export type AppUser = {
  id: string;
  email: string;
  name: string;
  password: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
};

export type SafeUser = Omit<AppUser, "password">;

const toSafe = (u: AppUser): SafeUser => ({
  id: u.id,
  email: u.email,
  name: u.name,
  role: u.role,
  is_active: u.is_active,
  created_at: u.created_at
});

function rowToUser(r: any): AppUser {
  return {
    id: String(r.id),
    email: r.email,
    name: r.name ?? "",
    password: r.password ?? "",
    role: r.role,
    is_active: r.is_active !== false,
    created_at: r.created_at
  };
}

export async function listUsers(): Promise<SafeUser[]> {
  const { data, error } = await sb().from("app_users").select("*").order("created_at", { ascending: true });
  if (error) throw new Error("list users: " + error.message);
  return (data ?? []).map(rowToUser).map(toSafe);
}

export async function findUserByEmail(email: string): Promise<AppUser | undefined> {
  const { data, error } = await sb()
    .from("app_users")
    .select("*")
    .ilike("email", email.trim())
    .maybeSingle();
  if (error) throw new Error("find user: " + error.message);
  return data ? rowToUser(data) : undefined;
}

export async function getUser(id: string): Promise<AppUser | undefined> {
  const { data, error } = await sb().from("app_users").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error("get user: " + error.message);
  return data ? rowToUser(data) : undefined;
}

export async function activeAdminCount(exceptId?: string): Promise<number> {
  let q = sb().from("app_users").select("id", { count: "exact", head: true }).eq("role", "admin").eq("is_active", true);
  if (exceptId) q = q.neq("id", exceptId);
  const { count, error } = await q;
  if (error) throw new Error("count admins: " + error.message);
  return count ?? 0;
}

export async function createUser(input: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}): Promise<SafeUser | { error: string }> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  if (!name) return { error: "กรุณากรอกชื่อ" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "รูปแบบอีเมลไม่ถูกต้อง" };
  if (!input.password || input.password.length < 6) return { error: "รหัสผ่านต้องยาวอย่างน้อย 6 ตัวอักษร" };
  if (!["user", "purchaser", "admin"].includes(input.role)) return { error: "บทบาทไม่ถูกต้อง" };
  const { data, error } = await sb()
    .from("app_users")
    .insert({ id: nid("u"), email, name, password: input.password, role: input.role, is_active: true, created_at: nowISO() })
    .select()
    .single();
  if (error) {
    if (error.code === "23505") return { error: "อีเมลนี้มีอยู่แล้ว" };
    throw new Error("create user: " + error.message);
  }
  return toSafe(rowToUser(data));
}

export async function updateUser(
  id: string,
  patch: { name?: string; role?: UserRole; is_active?: boolean; password?: string }
): Promise<SafeUser | { error: string } | undefined> {
  const upd: any = {};
  if (patch.name !== undefined) {
    if (!patch.name.trim()) return { error: "กรุณากรอกชื่อ" };
    upd.name = patch.name.trim();
  }
  if (patch.role !== undefined) {
    if (!["user", "purchaser", "admin"].includes(patch.role)) return { error: "บทบาทไม่ถูกต้อง" };
    upd.role = patch.role;
  }
  if (patch.is_active !== undefined) upd.is_active = patch.is_active;
  if (patch.password !== undefined) {
    if (patch.password.length < 6) return { error: "รหัสผ่านต้องยาวอย่างน้อย 6 ตัวอักษร" };
    upd.password = patch.password;
  }
  const { data, error } = await sb().from("app_users").update(upd).eq("id", id).select().maybeSingle();
  if (error) throw new Error("update user: " + error.message);
  return data ? toSafe(rowToUser(data)) : undefined;
}

export async function deleteUser(id: string): Promise<boolean> {
  const { count, error } = await sb().from("app_users").delete({ count: "exact" }).eq("id", id);
  if (error) throw new Error("delete user: " + error.message);
  return (count ?? 0) > 0;
}
