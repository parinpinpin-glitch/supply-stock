-- Phase 1 foundation: roles + core tables (lean, ตรง PRODUCT.md)
-- รันใน Supabase SQL Editor ได้เลย

-- 1) profiles (ผูกกับ auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null default '',
  role text not null default 'user' check (role in ('user','purchaser','admin')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 2) extra notification emails
create table if not exists public.extra_notification_emails (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 3) supplies
create table if not exists public.supplies (
  id uuid primary key default gen_random_uuid(),
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

-- 4) purchase orders (internal tracking)
create table if not exists public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  supply_id uuid not null references public.supplies(id) on delete cascade,
  ordered_qty numeric not null check (ordered_qty > 0),
  ordered_by_user_id uuid references public.profiles(id),
  ordered_at timestamptz not null default now(),
  expected_arrival_date date not null,
  received_status text not null default 'pending' check (received_status in ('pending','received','overdue')),
  received_at timestamptz,
  received_qty numeric,
  invoice_image_url text,
  notes text default ''
);

-- 5) stock movements
create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  supply_id uuid not null references public.supplies(id) on delete cascade,
  movement_type text not null check (movement_type in ('issue','order_marked','receive','adjust')),
  qty numeric not null check (qty > 0),
  performed_by_user_id uuid references public.profiles(id),
  performed_at timestamptz not null default now(),
  reference_purchase_order_id uuid references public.purchase_orders(id) on delete set null,
  notes text default ''
);

-- 6) email log
create table if not exists public.email_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in ('low_stock','overdue_arrival','received','ordered')),
  related_supply_id uuid references public.supplies(id) on delete set null,
  related_purchase_order_id uuid references public.purchase_orders(id) on delete set null,
  recipients text[] not null default '{}',
  sent_at timestamptz not null default now(),
  send_status text not null default 'sent'
);

-- RLS: เปิดแบบง่ายสุดสำหรับเวอร์ชันแรก (service_role ข้าม RLS; anon/authenticated อ่านตาม policy พื้นฐาน)
alter table public.profiles enable row level security;
alter table public.extra_notification_emails enable row level security;
alter table public.supplies enable row level security;
alter table public.purchase_orders enable row level security;
alter table public.stock_movements enable row level security;
alter table public.email_events enable row level security;

-- ลบ policy เก่าถ้ามีแล้วสร้างใหม่ (กันรันซ้ำ)
drop policy if exists "authenticated read all" on public.profiles;
drop policy if exists "authenticated read all" on public.extra_notification_emails;
drop policy if exists "authenticated read all" on public.supplies;
drop policy if exists "authenticated read all" on public.purchase_orders;
drop policy if exists "authenticated read all" on public.stock_movements;
drop policy if exists "authenticated read all" on public.email_events;

create policy "authenticated read all" on public.profiles for select to authenticated using (true);
create policy "authenticated read all" on public.extra_notification_emails for select to authenticated using (true);
create policy "authenticated read all" on public.supplies for select to authenticated using (true);
create policy "authenticated read all" on public.purchase_orders for select to authenticated using (true);
create policy "authenticated read all" on public.stock_movements for select to authenticated using (true);
create policy "authenticated read all" on public.email_events for select to authenticated using (true);
