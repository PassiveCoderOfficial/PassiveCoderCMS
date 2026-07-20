-- 050_marketplace.sql
-- Multi-vendor marketplace module (first tenant: Tanmoy Enterprise, home
-- services). Deliberately generic — not home-services-specific — so future
-- marketplace tenants (e.g. an ecommerce multi-vendor marketplace) reuse the
-- same vendors/commission/module-gating shape instead of forking new tables.
-- Vendors are rows scoped to ONE tenant_id (the marketplace-owner tenant),
-- not separate CMS tenants — tenant_members (owner/admin/editor/viewer)
-- stays untouched, unrelated to vendor identity.

begin;

-- ── Service catalog (marketplace-specific — separate from the generic
--    service_groups/service_items used by the public "Services" CMS block,
--    which has no vendor/price linkage) ───────────────────────────────────

create table if not exists public.service_categories (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  name        text not null,
  slug        text not null,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);
create unique index if not exists service_categories_tenant_slug_uq
  on public.service_categories(tenant_id, slug);

create table if not exists public.service_subcategories (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  category_id  uuid not null references public.service_categories(id) on delete cascade,
  name         text not null,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now()
);
create index if not exists service_subcategories_category_idx
  on public.service_subcategories(category_id);

-- ── Vendors ────────────────────────────────────────────────────────────────
-- Generic company profile; no home-services-only columns. commission_rate
-- is a percentage (e.g. 15.00 = 15%) charged on top of vendor's price.

create table if not exists public.vendors (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null references public.tenants(id) on delete cascade,
  name             text not null,
  contact_name     text,
  phone            text,
  email            text,
  address          text,
  lat              numeric(9,6),
  lng              numeric(9,6),
  status           text not null default 'pending'
                   check (status in ('pending','approved','suspended')),
  commission_rate  numeric(5,2) not null default 15.00,
  user_id          uuid references auth.users(id) on delete set null,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists vendors_tenant_idx on public.vendors(tenant_id, status);

-- ── Vendor <-> service offerings + price ────────────────────────────────────

create table if not exists public.vendor_services (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null references public.tenants(id) on delete cascade,
  vendor_id        uuid not null references public.vendors(id) on delete cascade,
  subcategory_id   uuid not null references public.service_subcategories(id) on delete cascade,
  price            numeric(12,2),
  active           boolean not null default true,
  created_at       timestamptz not null default now()
);
create unique index if not exists vendor_services_uq
  on public.vendor_services(vendor_id, subcategory_id);
create index if not exists vendor_services_tenant_idx on public.vendor_services(tenant_id);

-- ── Per-vendor availability ──────────────────────────────────────────────────
-- Deliberately NOT reusing booking_settings/booking_availability
-- (005_content_sections.sql) — those are UNIQUE(tenant_id), one calendar per
-- tenant, correct for the existing single-provider booking module but wrong
-- here: each vendor needs their own hours/capacity. Parallel vendor-scoped
-- tables instead of touching the live single-tenant booking feature.

create table if not exists public.vendor_availability (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  vendor_id    uuid not null references public.vendors(id) on delete cascade,
  day_of_week  int not null check (day_of_week between 0 and 6), -- 0=Sun,6=Sat
  open_time    time not null,
  close_time   time not null,
  is_open      boolean not null default true,
  unique (vendor_id, day_of_week)
);
create index if not exists vendor_availability_vendor_idx on public.vendor_availability(vendor_id);

create table if not exists public.vendor_blocked_dates (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  vendor_id     uuid not null references public.vendors(id) on delete cascade,
  blocked_date  date not null,
  reason        text,
  unique (vendor_id, blocked_date)
);
create index if not exists vendor_blocked_dates_vendor_idx on public.vendor_blocked_dates(vendor_id);

-- Per-vendor booking defaults (slot length/buffer/notice) — separate row per
-- vendor, unlike the single tenant-wide booking_settings row.
create table if not exists public.vendor_booking_settings (
  vendor_id           uuid primary key references public.vendors(id) on delete cascade,
  tenant_id           uuid not null references public.tenants(id) on delete cascade,
  slot_duration_mins  int not null default 60,
  buffer_mins         int not null default 15,
  advance_days        int not null default 30,
  min_notice_hours    int not null default 2,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ── Marketplace bookings ────────────────────────────────────────────────────
-- Deliberately separate from `jobs` (034_staff_jobs.sql): jobs is internal
-- staff assignment (staff_id, no vendor/commission concept, no
-- customer-facing marketplace flow). This is vendor-aware and carries a
-- commission snapshot so historical commission rate changes don't rewrite
-- past bookings. scheduled_time/end_time are real, slot-engine-validated
-- times (not free text) once a vendor is picked.

create table if not exists public.marketplace_bookings (
  id                 uuid primary key default gen_random_uuid(),
  tenant_id          uuid not null references public.tenants(id) on delete cascade,
  contact_id         uuid references public.contacts(id) on delete set null,
  vendor_id          uuid references public.vendors(id) on delete set null,
  subcategory_id     uuid references public.service_subcategories(id) on delete set null,
  customer_name      text,
  customer_phone     text,
  address            text,
  lat                numeric(9,6),
  lng                numeric(9,6),
  status             text not null default 'pending'
                     check (status in ('pending','confirmed','in_progress','completed','cancelled')),
  scheduled_date     date,
  scheduled_time     time,
  scheduled_end_time time,
  price              numeric(12,2),
  commission_rate    numeric(5,2),
  commission_amount  numeric(12,2),
  notes              text,
  completed_at       timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists marketplace_bookings_tenant_idx
  on public.marketplace_bookings(tenant_id, status, scheduled_date);
create index if not exists marketplace_bookings_vendor_idx
  on public.marketplace_bookings(vendor_id);
-- Prevent double-booking the same vendor into an overlapping-start slot at
-- the DB layer (belt-and-suspenders on top of app-layer slot validation).
create unique index if not exists marketplace_bookings_vendor_slot_uq
  on public.marketplace_bookings(vendor_id, scheduled_date, scheduled_time)
  where vendor_id is not null and status not in ('cancelled');

-- ── RLS (mirrors 034_staff_jobs.sql template) ───────────────────────────────

alter table public.service_categories     enable row level security;
alter table public.service_subcategories  enable row level security;
alter table public.vendors                enable row level security;
alter table public.vendor_services        enable row level security;
alter table public.vendor_availability    enable row level security;
alter table public.vendor_blocked_dates   enable row level security;
alter table public.vendor_booking_settings enable row level security;
alter table public.marketplace_bookings   enable row level security;

drop policy if exists "service_categories_read" on public.service_categories;
create policy "service_categories_read" on public.service_categories for select
  using (public.is_super_admin() or public.is_tenant_member(tenant_id));
drop policy if exists "service_categories_write" on public.service_categories;
create policy "service_categories_write" on public.service_categories for all
  using (public.is_super_admin() or public.is_tenant_editor(tenant_id))
  with check (public.is_super_admin() or public.is_tenant_editor(tenant_id));

drop policy if exists "service_subcategories_read" on public.service_subcategories;
create policy "service_subcategories_read" on public.service_subcategories for select
  using (public.is_super_admin() or public.is_tenant_member(tenant_id));
drop policy if exists "service_subcategories_write" on public.service_subcategories;
create policy "service_subcategories_write" on public.service_subcategories for all
  using (public.is_super_admin() or public.is_tenant_editor(tenant_id))
  with check (public.is_super_admin() or public.is_tenant_editor(tenant_id));

drop policy if exists "vendors_read" on public.vendors;
create policy "vendors_read" on public.vendors for select
  using (public.is_super_admin() or public.is_tenant_member(tenant_id));
drop policy if exists "vendors_write" on public.vendors;
create policy "vendors_write" on public.vendors for all
  using (public.is_super_admin() or public.is_tenant_editor(tenant_id))
  with check (public.is_super_admin() or public.is_tenant_editor(tenant_id));

drop policy if exists "vendor_services_read" on public.vendor_services;
create policy "vendor_services_read" on public.vendor_services for select
  using (public.is_super_admin() or public.is_tenant_member(tenant_id));
drop policy if exists "vendor_services_write" on public.vendor_services;
create policy "vendor_services_write" on public.vendor_services for all
  using (public.is_super_admin() or public.is_tenant_editor(tenant_id))
  with check (public.is_super_admin() or public.is_tenant_editor(tenant_id));

drop policy if exists "marketplace_bookings_read" on public.marketplace_bookings;
create policy "marketplace_bookings_read" on public.marketplace_bookings for select
  using (public.is_super_admin() or public.is_tenant_member(tenant_id));
drop policy if exists "marketplace_bookings_write" on public.marketplace_bookings;
create policy "marketplace_bookings_write" on public.marketplace_bookings for all
  using (public.is_super_admin() or public.is_tenant_editor(tenant_id))
  with check (public.is_super_admin() or public.is_tenant_editor(tenant_id));
-- Storefront customers create bookings without a session (same pattern as
-- booking_appointments' "public_book" policy in 005_content_sections.sql).
-- The public API route (createAdminClient) is the one actually used, but
-- this keeps the table's own RLS honest/defense-in-depth.
drop policy if exists "marketplace_bookings_public_insert" on public.marketplace_bookings;
create policy "marketplace_bookings_public_insert" on public.marketplace_bookings for insert
  with check (true);

drop policy if exists "vendor_availability_read" on public.vendor_availability;
create policy "vendor_availability_read" on public.vendor_availability for select
  using (public.is_super_admin() or public.is_tenant_member(tenant_id));
drop policy if exists "vendor_availability_write" on public.vendor_availability;
create policy "vendor_availability_write" on public.vendor_availability for all
  using (public.is_super_admin() or public.is_tenant_editor(tenant_id))
  with check (public.is_super_admin() or public.is_tenant_editor(tenant_id));

drop policy if exists "vendor_blocked_dates_read" on public.vendor_blocked_dates;
create policy "vendor_blocked_dates_read" on public.vendor_blocked_dates for select
  using (public.is_super_admin() or public.is_tenant_member(tenant_id));
drop policy if exists "vendor_blocked_dates_write" on public.vendor_blocked_dates;
create policy "vendor_blocked_dates_write" on public.vendor_blocked_dates for all
  using (public.is_super_admin() or public.is_tenant_editor(tenant_id))
  with check (public.is_super_admin() or public.is_tenant_editor(tenant_id));

drop policy if exists "vendor_booking_settings_read" on public.vendor_booking_settings;
create policy "vendor_booking_settings_read" on public.vendor_booking_settings for select
  using (public.is_super_admin() or public.is_tenant_member(tenant_id));
drop policy if exists "vendor_booking_settings_write" on public.vendor_booking_settings;
create policy "vendor_booking_settings_write" on public.vendor_booking_settings for all
  using (public.is_super_admin() or public.is_tenant_editor(tenant_id))
  with check (public.is_super_admin() or public.is_tenant_editor(tenant_id));

-- ── Forward-compat: nullable vendor_id on products/orders, unused until an
--    ecommerce-marketplace tenant exists. Added now (cheap, zero behavior
--    change today) so that future work reuses this same `vendors` table
--    instead of a second one being forked because this column was forgotten.
--    NULL vendor_id = tenant's own product (today's only case). ───────────

alter table public.products add column if not exists vendor_id uuid references public.vendors(id) on delete set null;
alter table public.orders   add column if not exists vendor_id uuid references public.vendors(id) on delete set null;
create index if not exists products_vendor_idx on public.products(vendor_id) where vendor_id is not null;
create index if not exists orders_vendor_idx   on public.orders(vendor_id)   where vendor_id is not null;

-- ── Module gating: add "marketplace" to every existing plan's modules map,
--    off by default (new capability, no existing tenant should get it for
--    free) — Tanmoy's plan/tenant gets it turned on separately below. ───────

update public.plans
set modules = modules || '{"marketplace": {"included": false, "defaultOn": false}}'::jsonb
where not (modules ? 'marketplace');

commit;
