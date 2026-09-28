-- Marketplace growth features: product variants for sellers, timed flash
-- sales, and vouchers (seller-funded and platform-funded).
--
-- Money rules (see split-order.ts):
--  * seller voucher  -> sub_orders.discount          (reduces seller revenue;
--                       commission is charged on subtotal - discount)
--  * platform voucher -> sub_orders.platform_discount (customer pays less, the
--                       seller is still owed the full amount; the platform
--                       absorbs it). Never mixed into `discount`.

-- ─── Variants ─────────────────────────────────────────────────────────
alter table public.product_variants
  add column if not exists sort_order int not null default 0,
  add column if not exists is_active  boolean not null default true;

create index if not exists product_variants_product_idx
  on public.product_variants (product_id, sort_order);

-- Sellers may manage variants of their own products (public read already
-- exists from 001; tenant admins keep their existing policy).
drop policy if exists product_variants_vendor_manage on public.product_variants;
create policy product_variants_vendor_manage on public.product_variants
  for all using (
    exists (select 1 from public.products p
             where p.id = product_id and p.vendor_id is not null and public.owns_vendor(p.vendor_id))
  ) with check (
    exists (select 1 from public.products p
             where p.id = product_id and p.vendor_id is not null and public.owns_vendor(p.vendor_id))
  );

-- ─── Flash sales ──────────────────────────────────────────────────────
create table if not exists public.flash_sales (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  title       text not null default 'Flash Sale',
  starts_at   timestamptz not null,
  ends_at     timestamptz not null,
  status      text not null default 'active' check (status in ('draft','active','ended')),
  created_at  timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index if not exists flash_sales_window_idx on public.flash_sales (tenant_id, starts_at, ends_at);

create table if not exists public.flash_sale_items (
  id              uuid primary key default gen_random_uuid(),
  flash_sale_id   uuid not null references public.flash_sales(id) on delete cascade,
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  product_id      uuid not null references public.products(id) on delete cascade,
  sale_price      numeric(12,2) not null check (sale_price >= 0),
  quantity_limit  int,                       -- null = until stock runs out
  sold            int not null default 0,
  sort_order      int not null default 0,
  unique (flash_sale_id, product_id)
);
create index if not exists flash_sale_items_product_idx on public.flash_sale_items (product_id);

alter table public.flash_sales enable row level security;
alter table public.flash_sale_items enable row level security;
drop policy if exists flash_sales_public_read on public.flash_sales;
create policy flash_sales_public_read on public.flash_sales for select using (status = 'active');
drop policy if exists flash_sale_items_public_read on public.flash_sale_items;
create policy flash_sale_items_public_read on public.flash_sale_items for select using (true);

-- Atomic claim of flash-sale quantity so two buyers can't both take the
-- last discounted unit. Returns false if the limit would be exceeded.
create or replace function public.claim_flash_quantity(item uuid, qty int)
returns boolean language plpgsql security definer set search_path = public as $$
declare ok boolean;
begin
  update public.flash_sale_items
     set sold = sold + qty
   where id = item
     and (quantity_limit is null or sold + qty <= quantity_limit)
  returning true into ok;
  return coalesce(ok, false);
end $$;
revoke all on function public.claim_flash_quantity(uuid, int) from public, anon, authenticated;

-- ─── Vouchers ─────────────────────────────────────────────────────────
create table if not exists public.vouchers (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  vendor_id       uuid references public.vendors(id) on delete cascade,  -- null = platform voucher
  code            text not null,
  title           text not null,
  kind            text not null check (kind in ('percent','fixed','free_shipping')),
  value           numeric(12,2) not null default 0,
  max_discount    numeric(12,2),
  min_spend       numeric(12,2) not null default 0,
  starts_at       timestamptz not null default now(),
  ends_at         timestamptz,
  usage_limit     int,
  per_user_limit  int not null default 1,
  used_count      int not null default 0,
  is_public       boolean not null default true,   -- shown/claimable on storefront
  status          text not null default 'active' check (status in ('active','paused')),
  created_at      timestamptz not null default now()
);
create unique index if not exists vouchers_code_idx on public.vouchers (tenant_id, upper(code));
create index if not exists vouchers_vendor_idx on public.vouchers (tenant_id, vendor_id);

create table if not exists public.voucher_redemptions (
  id           uuid primary key default gen_random_uuid(),
  voucher_id   uuid not null references public.vouchers(id) on delete cascade,
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  order_id     uuid references public.orders(id) on delete set null,
  customer_id  uuid references auth.users(id) on delete set null,
  phone        text,
  amount       numeric(12,2) not null,
  created_at   timestamptz not null default now()
);
create index if not exists voucher_redemptions_voucher_idx on public.voucher_redemptions (voucher_id, customer_id);

alter table public.vouchers enable row level security;
alter table public.voucher_redemptions enable row level security;
drop policy if exists vouchers_public_read on public.vouchers;
create policy vouchers_public_read on public.vouchers
  for select using (status = 'active' and is_public);

-- Platform-funded discount lives apart from the seller discount.
alter table public.sub_orders
  add column if not exists platform_discount numeric(12,2) not null default 0;
alter table public.orders
  add column if not exists voucher_codes text[] not null default '{}';
