-- Customer account extensions (2026-09-07): saved profile/address + wishlists.
--
-- Builds on the customer account system from migration 083 (orders.customer_id
-- + orders_customer_read_own). Same auth.users identity, same
-- customer_id = auth.uid() pattern for RLS -- a customer only ever sees their
-- own rows, scoped further by tenant_id since one auth.users account can be
-- a customer of more than one tenant's storefront on this platform.

-- One row per (tenant, customer): name/phone/default shipping address,
-- editable from /account. Folded into a single default address rather than
-- a full multi-address book -- smallest real version, same call as the
-- original account-system scope decision.
create table if not exists customer_profiles (
  tenant_id uuid not null references tenants(id) on delete cascade,
  customer_id uuid not null references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  address_line1 text,
  address_line2 text,
  city text,
  area text,
  postal_code text,
  country text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (tenant_id, customer_id)
);

alter table customer_profiles enable row level security;

create policy customer_profiles_own_select
  on customer_profiles for select
  using (customer_id = auth.uid());

create policy customer_profiles_own_upsert
  on customer_profiles for insert
  with check (customer_id = auth.uid());

create policy customer_profiles_own_update
  on customer_profiles for update
  using (customer_id = auth.uid())
  with check (customer_id = auth.uid());

-- Wishlist: (tenant, customer, product) — a customer save-for-later on a
-- product. unique so re-saving the same product is a no-op, not a duplicate
-- row; product_id cascades so a deleted product silently drops off wishlists
-- rather than leaving a dangling reference a page would 404 on.
create table if not exists wishlist_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  customer_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (tenant_id, customer_id, product_id)
);

alter table wishlist_items enable row level security;

create policy wishlist_items_own_select
  on wishlist_items for select
  using (customer_id = auth.uid());

create policy wishlist_items_own_insert
  on wishlist_items for insert
  with check (customer_id = auth.uid());

create policy wishlist_items_own_delete
  on wishlist_items for delete
  using (customer_id = auth.uid());

create index if not exists wishlist_items_customer_idx on wishlist_items (tenant_id, customer_id);
