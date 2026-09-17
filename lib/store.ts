import fs from "fs";
import path from "path";
import { DEMO_USERS, type UserRole } from "@/lib/auth";

// ชั้นเก็บข้อมูล Phase 3: file store ง่ายๆ (field ตรง supabase/001_init.sql)
// Phase ถัดไปค่อยเสียบ Supabase โดยไม่เปลี่ยน API/UI

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

const DB_PATH = path.join(process.cwd(), "data", "db.json");

function seedSupplies(): Supply[] {
  const now = new Date().toISOString();
  return [
    {
      id: "seed-a4-80",
      item_name: "กระดาษ A4 80 แกรม",
      item_code_or_short_name: "A4-80",
      supplier_name: "Siam Paper",
      current_stock: 120,
      unit: "รีม",
      reorder_point: 20,
      lead_time_days: 7,
      last_purchase_date: null,
      image_url: null,
      is_active: true,
      created_at: now,
      updated_at: now
    },
    {
      id: "seed-ink-680",
      item_name: "หมึกพิมพ์ HP 680 สีดำ",
      item_code_or_short_name: "INK-680BK",
      supplier_name: "HP Center",
      current_stock: 5,
      unit: "ตลับ",
      reorder_point: 10,
      lead_time_days: 14,
      last_purchase_date: null,
      image_url: null,
      is_active: true,
      created_at: now,
      updated_at: now
    }
  ];
}

export function readSupplies(): Supply[] {
  return readDb().supplies;
}

type DbShape = {
  supplies: Supply[];
  movements: Movement[];
  orders: PurchaseOrder[];
  extra_emails: ExtraEmail[];
  email_logs: EmailLog[];
  users: AppUser[];
};

function seedUsers(): AppUser[] {
  const now = new Date().toISOString();
  return DEMO_USERS.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    password: u.password,
    role: u.role,
    is_active: true,
    created_at: now
  }));
}

function readDb(): DbShape {
  try {
    if (!fs.existsSync(DB_PATH)) {
      const fresh: DbShape = { supplies: seedSupplies(), movements: [], orders: [], extra_emails: [], email_logs: [], users: seedUsers() };
      fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
      fs.writeFileSync(DB_PATH, JSON.stringify(fresh, null, 2), "utf-8");
      return fresh;
    }
    const raw = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
    const supplies = (Array.isArray(raw.supplies) ? (raw.supplies as Supply[]) : []).map((s) => ({
      ...s,
      image_url: s.image_url ?? null
    }));
    return {
      supplies,
      movements: Array.isArray(raw.movements) ? (raw.movements as Movement[]) : [],
      orders: Array.isArray(raw.orders) ? (raw.orders as PurchaseOrder[]) : [],
      extra_emails: Array.isArray(raw.extra_emails) ? (raw.extra_emails as ExtraEmail[]) : [],
      email_logs: Array.isArray(raw.email_logs) ? (raw.email_logs as EmailLog[]) : [],
      users: Array.isArray(raw.users) && raw.users.length > 0 ? (raw.users as AppUser[]) : seedUsers()
    };
  } catch {
    return { supplies: [], movements: [], orders: [], extra_emails: [], email_logs: [], users: seedUsers() };
  }
}

function writeDb(db: DbShape) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
}

export function writeSupplies(supplies: Supply[]) {
  const db = readDb();
  db.supplies = supplies;
  writeDb(db);
}

// --- Stock movements (เริ่มบันทึก Phase 3: issue; order/receive เพิ่ม Phase 4) ---

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

export function readMovements(): Movement[] {
  return readDb().movements;
}

export function addMovement(m: Omit<Movement, "id">): Movement {
  const db = readDb();
  const created: Movement = {
    ...m,
    id: `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
  };
  db.movements.unshift(created);
  writeDb(db);
  return created;
}

export function movementsForSupply(supplyId: string, limit = 10): Movement[] {
  return readMovements().filter((m) => m.supply_id === supplyId).slice(0, limit);
}

export const MOVEMENT_LABEL: Record<MovementType, string> = {
  issue: "เบิกของ",
  order_marked: "สั่งซื้อแล้ว",
  receive: "รับของเข้า",
  adjust: "ปรับ stock"
};

// --- Purchase orders (Phase 4) ---

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

function readOrders(): PurchaseOrder[] {
  return readDb().orders;
}

function writeOrders(orders: PurchaseOrder[]) {
  const db = readDb();
  db.orders = orders;
  writeDb(db);
}

export function listOrders(filter?: { status?: ReceivedStatus | "overdue"; supply_id?: string }): PurchaseOrder[] {
  let orders = readOrders();
  if (filter?.supply_id) orders = orders.filter((o) => o.supply_id === filter.supply_id);
  if (filter?.status === "overdue") orders = orders.filter((o) => isOverdue(o));
  else if (filter?.status) orders = orders.filter((o) => o.received_status === filter.status);
  return orders;
}

export function findOrder(id: string): PurchaseOrder | undefined {
  return readOrders().find((o) => o.id === id);
}

export function createOrder(o: Omit<PurchaseOrder, "id">): PurchaseOrder {
  const orders = readOrders();
  const created: PurchaseOrder = {
    ...o,
    id: `po-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
  };
  orders.unshift(created);
  writeOrders(orders);
  return created;
}

export function updateOrder(id: string, patch: Partial<PurchaseOrder>): PurchaseOrder | undefined {
  const orders = readOrders();
  const idx = orders.findIndex((o) => o.id === id);
  if (idx === -1) return undefined;
  orders[idx] = { ...orders[idx], ...patch };
  writeOrders(orders);
  return orders[idx];
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

// --- Extra notification emails (Admin จัดการ, Phase 5) ---

export type ExtraEmail = {
  id: string;
  email: string;
  is_active: boolean;
  created_at: string;
};

export function listExtraEmails(): ExtraEmail[] {
  return readDb().extra_emails;
}

export function addExtraEmail(email: string): ExtraEmail | { error: string } {
  const clean = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) return { error: "รูปแบบอีเมลไม่ถูกต้อง" };
  const db = readDb();
  if (db.extra_emails.some((e) => e.email === clean)) return { error: "อีเมลนี้มีอยู่แล้ว" };
  const created: ExtraEmail = {
    id: `em-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    email: clean,
    is_active: true,
    created_at: new Date().toISOString()
  };
  db.extra_emails.push(created);
  writeDb(db);
  return created;
}

export function setExtraEmailActive(id: string, is_active: boolean): ExtraEmail | undefined {
  const db = readDb();
  const found = db.extra_emails.find((e) => e.id === id);
  if (!found) return undefined;
  found.is_active = is_active;
  writeDb(db);
  return found;
}

export function deleteExtraEmail(id: string): boolean {
  const db = readDb();
  const before = db.extra_emails.length;
  db.extra_emails = db.extra_emails.filter((e) => e.id !== id);
  if (db.extra_emails.length === before) return false;
  writeDb(db);
  return true;
}

// --- Email logs (กันส่งซ้ำ + ไว้ตรวจ, Phase 5) ---

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

export function listEmailLogs(limit = 20): EmailLog[] {
  return readDb().email_logs.slice(0, limit);
}

export function logEmail(log: Omit<EmailLog, "id" | "sent_at">): EmailLog {
  const db = readDb();
  const created: EmailLog = {
    ...log,
    id: `el-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    sent_at: new Date().toISOString()
  };
  db.email_logs.unshift(created);
  writeDb(db);
  return created;
}

// เคยแจ้ง overdue ของ order นี้แล้วหรือยัง (กันส่งซ้ำ — นับทุกสถานะเพื่อไม่ให้ log ซ้ำทุกครั้งที่เปิด dashboard)
export function overdueNotified(orderId: string): boolean {
  return readDb().email_logs.some(
    (l) => l.event_type === "overdue_arrival" && l.related_purchase_order_id === orderId
  );
}

// --- Users (Admin จัดการ; demo auth เก็บรหัส plain — ย้ายไป Supabase Auth เมื่อใช้จริง) ---

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

export function listUsers(): SafeUser[] {
  return readDb().users.map(toSafe);
}

export function findUserByEmail(email: string): AppUser | undefined {
  return readDb().users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
}

export function getUser(id: string): AppUser | undefined {
  return readDb().users.find((u) => u.id === id);
}

export function activeAdminCount(exceptId?: string): number {
  return readDb().users.filter((u) => u.role === "admin" && u.is_active && u.id !== exceptId).length;
}

export function createUser(input: { name: string; email: string; password: string; role: UserRole }): SafeUser | { error: string } {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  if (!name) return { error: "กรุณากรอกชื่อ" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "รูปแบบอีเมลไม่ถูกต้อง" };
  if (!input.password || input.password.length < 6) return { error: "รหัสผ่านต้องยาวอย่างน้อย 6 ตัวอักษร" };
  if (!["user", "purchaser", "admin"].includes(input.role)) return { error: "บทบาทไม่ถูกต้อง" };
  const db = readDb();
  if (db.users.some((u) => u.email.toLowerCase() === email)) return { error: "อีเมลนี้มีอยู่แล้ว" };
  const created: AppUser = {
    id: `u-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    email,
    name,
    password: input.password,
    role: input.role,
    is_active: true,
    created_at: new Date().toISOString()
  };
  db.users.push(created);
  writeDb(db);
  return toSafe(created);
}

export function updateUser(
  id: string,
  patch: { name?: string; role?: UserRole; is_active?: boolean; password?: string }
): SafeUser | { error: string } | undefined {
  const db = readDb();
  const u = db.users.find((x) => x.id === id);
  if (!u) return undefined;
  if (patch.name !== undefined) {
    if (!patch.name.trim()) return { error: "กรุณากรอกชื่อ" };
    u.name = patch.name.trim();
  }
  if (patch.role !== undefined) {
    if (!["user", "purchaser", "admin"].includes(patch.role)) return { error: "บทบาทไม่ถูกต้อง" };
    u.role = patch.role;
  }
  if (patch.is_active !== undefined) u.is_active = patch.is_active;
  if (patch.password !== undefined) {
    if (patch.password.length < 6) return { error: "รหัสผ่านต้องยาวอย่างน้อย 6 ตัวอักษร" };
    u.password = patch.password;
  }
  writeDb(db);
  return toSafe(u);
}

export function deleteUser(id: string): boolean {
  const db = readDb();
  const before = db.users.length;
  db.users = db.users.filter((u) => u.id !== id);
  if (db.users.length === before) return false;
  writeDb(db);
  return true;
}

export function findSupply(id: string): Supply | undefined {
  return readSupplies().find((s) => s.id === id);
}

export function setSupplyImage(id: string, image_url: string | null): Supply | undefined {
  const all = readSupplies();
  const idx = all.findIndex((s) => s.id === id);
  if (idx === -1) return undefined;
  all[idx] = { ...all[idx], image_url, updated_at: new Date().toISOString() };
  writeSupplies(all);
  return all[idx];
}

export function isLowStock(s: Supply) {
  return s.current_stock <= s.reorder_point;
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

  const num = (v: any, label: string, allowDecimal = true): number | null => {
    if (v === "" || v === null || v === undefined) return null;
    const n = allowDecimal ? Number(v) : Math.trunc(Number(v));
    if (!Number.isFinite(n)) return NaN as unknown as null;
    return n;
  };

  const current_stock = num(body?.current_stock, "จำนวนคงเหลือ");
  if (current_stock === null || current_stock === undefined || Number.isNaN(current_stock as number))
    return { ok: false, error: "จำนวนคงเหลือต้องเป็นตัวเลข" };
  if ((current_stock as number) < 0) return { ok: false, error: "จำนวนคงเหลือห้ามติดลบ" };

  const reorder_point = num(body?.reorder_point, "ROP");
  if (reorder_point === null || reorder_point === undefined || Number.isNaN(reorder_point as number))
    return { ok: false, error: "ROP ต้องเป็นตัวเลข" };
  if ((reorder_point as number) < 0) return { ok: false, error: "ROP ห้ามติดลบ" };

  const lead_time_days = num(body?.lead_time_days, "lead time", false);
  if (lead_time_days === null || lead_time_days === undefined || Number.isNaN(lead_time_days as number))
    return { ok: false, error: "Lead time ต้องเป็นตัวเลข" };
  if ((lead_time_days as number) < 0) return { ok: false, error: "Lead time ห้ามติดลบ" };

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
      lead_time_days: lead_time_days as number,
      is_active: body?.is_active === false ? false : true
    }
  };
}
