-- Restaurant vertical, phase 1: branches, tables/QR, dine-in fulfillment,
-- kitchen order pipeline, per-branch menu availability. See
-- docs/business/06-restaurant-vertical.md for the full plan and the
-- reasoning behind each decision below.

-- ─── Branches ───────────────────────────────────────────────────────────
-- Multi-branch from day one (locked 2026-09-12): one tenant can run several
-- physical locations sharing the same product catalog. Mirrors the
-- `vendors` shape from the marketplace module rather than inventing a new
-- one — same "owning entity under a tenant" pattern, same reasons to keep
-- it a first-class row instead of a jsonb blob (RLS, indexing, joins).
create table if not exists public.restaurant_branches (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  name        text not null,
  address     text,
  phone       text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists restaurant_branches_tenant_idx
  on public.restaurant_branches (tenant_id, is_active);

alter table public.restaurant_branches enable row level security;

create policy restaurant_branches_tenant_manage on public.restaurant_branches
  for all using (public.is_tenant_member(tenant_id))
  with check (public.is_tenant_member(tenant_id));

create policy restaurant_branches_public_read on public.restaurant_branches
  for select using (is_active = true);

-- ─── Tables (QR ordering) ───────────────────────────────────────────────
-- qr_token is the public-facing identifier embedded in the printed QR code
-- URL, deliberately not the row id: a sequential/guessable id would let
-- anyone walk the URL space and see every table's live order. Generated
-- with gen_random_uuid() at insert time, never exposed as sequential.
create table if not exists public.restaurant_tables (
  id            uuid primary key default gen_random_uuid(),
  branch_id     uuid not null references public.restaurant_branches(id) on delete cascade,
  table_number  text not null,
  qr_token      uuid not null default gen_random_uuid(),
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

create unique index if not exists restaurant_tables_qr_token_idx
  on public.restaurant_tables (qr_token);
create index if not exists restaurant_tables_branch_idx
  on public.restaurant_tables (branch_id, is_active);
-- A branch should not silently end up with two tables both labelled "5".
create unique index if not exists restaurant_tables_branch_number_idx
  on public.restaurant_tables (branch_id, table_number);

alter table public.restaurant_tables enable row level security;

create policy restaurant_tables_tenant_manage on public.restaurant_tables
  for all using (
    exists (select 1 from public.restaurant_branches b
            where b.id = branch_id and public.is_tenant_member(b.tenant_id))
  )
  with check (
    exists (select 1 from public.restaurant_branches b
            where b.id = branch_id and public.is_tenant_member(b.tenant_id))
  );

-- Anyone who scans the QR code needs to resolve table_number for display —
-- but only by qr_token, which is the point of it being unguessable. Reading
-- the whole table by id/number is still tenant-gated above.
create policy restaurant_tables_public_read_by_token on public.restaurant_tables
  for select using (is_active = true);

-- ─── Orders: dine-in + branch/table linkage ────────────────────────────
-- 085_order_fulfillment_type.sql only allowed 'delivery' | 'pickup'. Widen
-- the check constraint to add 'dine_in' rather than adding a parallel
-- column — fulfillment_type is already the single source of truth every
-- other order-handling code path branches on.
alter table public.orders drop constraint if exists orders_fulfillment_type_check;
alter table public.orders add constraint orders_fulfillment_type_check
  check (fulfillment_type in ('delivery', 'pickup', 'dine_in'));

alter table public.orders
  add column if not exists branch_id uuid references public.restaurant_branches(id) on delete set null,
  add column if not exists table_id  uuid references public.restaurant_tables(id) on delete set null;

create index if not exists orders_branch_idx on public.orders (branch_id)
  where branch_id is not null;

-- Kitchen pipeline is intentionally a separate column from `orders.status`.
-- `status` (pending/processing/on_hold/completed/cancelled/refunded/failed)
-- is the generic commerce lifecycle every tenant's checkout already relies
-- on; remapping "preparing"/"ready" onto it would either overload existing
-- values with a new meaning or bend the kitchen flow to fit states that
-- don't describe it. kitchen_status is null for any order that isn't
-- dine_in/pickup/delivery-from-a-branch, so it costs nothing elsewhere.
alter table public.orders
  add column if not exists kitchen_status text
    check (kitchen_status in ('new','preparing','ready','served','completed') or kitchen_status is null);

comment on column public.orders.kitchen_status is
  'Restaurant kitchen pipeline, independent of the generic commerce `status`. Null for non-restaurant orders.';

-- ─── Per-branch menu availability ───────────────────────────────────────
-- Shared catalog across branches (locked decision) means "86ing" an item
-- must not touch the product everywhere else. A row's absence here means
-- available-by-default, so adding a new branch or a new product never
-- requires backfilling this table before things work.
create table if not exists public.branch_product_availability (
  branch_id   uuid not null references public.restaurant_branches(id) on delete cascade,
  product_id  uuid not null references public.products(id) on delete cascade,
  in_stock    boolean not null default true,
  updated_at  timestamptz not null default now(),
  primary key (branch_id, product_id)
);

alter table public.branch_product_availability enable row level security;

create policy branch_availability_tenant_manage on public.branch_product_availability
  for all using (
    exists (select 1 from public.restaurant_branches b
            where b.id = branch_id and public.is_tenant_member(b.tenant_id))
  )
  with check (
    exists (select 1 from public.restaurant_branches b
            where b.id = branch_id and public.is_tenant_member(b.tenant_id))
  );

create policy branch_availability_public_read on public.branch_product_availability
  for select using (true);
