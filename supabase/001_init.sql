-- SupplyStock schema v2 (production)
-- หมายเหตุ: v1 ใช้ uuid แต่ข้อมูลจริงของแอพใช้ text ids (เช่น seed-a4-80, po-xxx)
-- จึงสร้างตารางใหม่ด้วย text ids ให้ตรงกับโครงแอพ 1:1 (project ยังไม่มีข้อมูลจริง ลบของเก่าทิ้งได้)
-- วิธีรัน: copy ทั้งไฟล์ไปวางใน Supabase SQL Editor แล้วกด Run

drop table if exists public.email_events;
drop table if exists public.stock_movements;
drop table if exists public.purchase_orders;
drop table if exists public.extra_notification_emails;
drop table if exists public.profiles;

-- users (demo auth ของแอพ — ย้ายไป Supabase Auth ในอนาคต)
create table public.app_users (
  id text primary key,
  email text not null unique,
  name text not null default '',
  password text not null,
  role text not null default 'user' check (role in ('user','purchaser','admin')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- extra notification emails
create table public.extra_emails (
  id text primary key,
  email text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- supplies
create table public.supplies (
  id text primary key,
  item_name text not null,
  item_code_or_short_name text not null default '',
  supplier_name text not null default '',
  current_stock numeric not null default 0,
  unit text not null default 'ชิ้น',
  reorder_point numeric not null default 0,
  lead_time_days integer not null default 0,
  last_purchase_date date,
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- purchase orders (internal tracking)
create table public.purchase_orders (
  id text primary key,
  supply_id text not null,
  ordered_qty numeric not null check (ordered_qty > 0),
  ordered_by_user_id text,
  ordered_by_name text not null default '',
  ordered_at timestamptz not null default now(),
  expected_arrival_date date not null,
  received_status text not null default 'pending' check (received_status in ('pending','received')),
  received_at timestamptz,
  received_qty numeric,
  invoice_image_url text,
  notes text not null default ''
);

-- stock movements
create table public.stock_movements (
  id text primary key,
  supply_id text not null,
  movement_type text not null check (movement_type in ('issue','order_marked','receive','adjust')),
  qty numeric not null check (qty > 0),
  performed_by_user_id text,
  performed_by_name text not null default '',
  performed_at timestamptz not null default now(),
  reference_purchase_order_id text,
  notes text not null default ''
);

-- email log (กันส่งซ้ำ + ไว้ตรวจ)
create table public.email_logs (
  id text primary key,
  event_type text not null check (event_type in ('low_stock','overdue_arrival','received')),
  related_supply_id text,
  related_purchase_order_id text,
  recipients text[] not null default '{}',
  sent_at timestamptz not null default now(),
  send_status text not null default 'sent',
  note text not null default ''
);

-- RLS: เปิดไว้ แต่ไม่มี policy ใดๆ = มีแค่ service_role เข้าถึงได้
-- (แอพเรียกผ่าน service_role จาก server เท่านั้น ไม่เรียกตรงจาก browser)
alter table public.app_users enable row level security;
alter table public.extra_emails enable row level security;
alter table public.supplies enable row level security;
alter table public.purchase_orders enable row level security;
alter table public.stock_movements enable row level security;
alter table public.email_logs enable row level security;
