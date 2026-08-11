-- Multi-vendor ecommerce core: order splitting, commission ledger, payouts,
-- shipping. Daraz-style — every vendor lists their own independent products
-- (no shared catalog / buy box), ships direct to the customer.

-- ─── Products: vendor listing approval ────────────────────────────────
-- products.tenant_id / vendor_id already exist in the live schema.
alter table public.products
  add column if not exists approval_status text not null default 'approved'
    check (approval_status in ('pending','approved','rejected')),
  add column if not exists rejection_reason text,
  add column if not exists approved_at timestamptz,
  add column if not exists brand text;

create index if not exists products_vendor_idx on public.products (vendor_id)
  where vendor_id is not null;
create index if not exists products_tenant_status_idx
  on public.products (tenant_id, status, approval_status);

-- Vendor-owned products must clear review before going public. Existing
-- single-store products keep approval_status 'approved' (the column default)
-- so nothing already live disappears from a storefront.
drop policy if exists products_public_read on public.products;
create policy products_public_read on public.products
  for select using (
    status = 'active'
    and (vendor_id is null or approval_status = 'approved')
  );

-- Vendors manage only their own listings.
drop policy if exists products_vendor_manage on public.products;
create policy products_vendor_manage on public.products
  for all using (vendor_id is not null and public.owns_vendor(vendor_id))
  with check (vendor_id is not null and public.owns_vendor(vendor_id));

-- ─── Sub-orders: one per vendor within a customer order ────────────────
-- orders stays the customer-facing payment envelope; sub_orders is the unit
-- of fulfilment, status, courier and money. Vendors ship direct, so these
-- are fully independent of one another.
create table if not exists public.sub_orders (
  id                uuid primary key default gen_random_uuid(),
  tenant_id         uuid not null references public.tenants(id) on delete cascade,
  order_id          uuid not null references public.orders(id) on delete cascade,
  vendor_id         uuid not null references public.vendors(id),
  sub_order_number  text not null unique,
  status            text not null default 'pending'
                    check (status in ('pending','accepted','packed','shipped',
                                      'delivered','cancelled','returned')),
  items             jsonb not null default '[]',
  subtotal          numeric(12,2) not null default 0,
  shipping_cost     numeric(12,2) not null default 0,
  discount          numeric(12,2) not null default 0,
  total             numeric(12,2) not null default 0,
  -- Snapshot at order time: changing a vendor's rate later must never
  -- retroactively alter what they earned on past orders.
  commission_rate   numeric(5,2) not null,
  commission_amount numeric(12,2) not null default 0,
  vendor_earning    numeric(12,2) not null default 0,
  courier           text,
  tracking_number   text,
  cod_amount        numeric(12,2) not null default 0,
  cod_collected     boolean not null default false,
  payout_id         uuid,
  cancel_reason     text,
  accepted_at       timestamptz,
  shipped_at        timestamptz,
  delivered_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists sub_orders_tenant_idx  on public.sub_orders (tenant_id, created_at desc);
create index if not exists sub_orders_vendor_idx  on public.sub_orders (vendor_id, status);
create index if not exists sub_orders_order_idx   on public.sub_orders (order_id);
create index if not exists sub_orders_payout_idx  on public.sub_orders (payout_id) where payout_id is not null;

-- ─── Payouts ──────────────────────────────────────────────────────────
create table if not exists public.vendor_payouts (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  vendor_id     uuid not null references public.vendors(id),
  period_start  date not null,
  period_end    date not null,
  gross         numeric(12,2) not null default 0,
  commission    numeric(12,2) not null default 0,
  adjustments   numeric(12,2) not null default 0,
  net           numeric(12,2) not null default 0,
  method        text not null default 'bkash' check (method in ('bkash','bank','cash')),
  status        text not null default 'pending'
                check (status in ('pending','processing','paid','failed')),
  reference     text,
  paid_at       timestamptz,
  notes         text,
  created_at    timestamptz not null default now()
);

create index if not exists vendor_payouts_tenant_idx on public.vendor_payouts (tenant_id, created_at desc);
create index if not exists vendor_payouts_vendor_idx on public.vendor_payouts (vendor_id, status);

alter table public.sub_orders
  drop constraint if exists sub_orders_payout_id_fkey;
alter table public.sub_orders
  add constraint sub_orders_payout_id_fkey
  foreign key (payout_id) references public.vendor_payouts(id) on delete set null;

-- ─── Ledger: append-only record of every vendor money event ────────────
-- With COD the courier collects cash on the platform's behalf, so "vendor
-- earned X" and "platform actually holds X" diverge constantly. The ledger
-- is the only reliable answer to "what do we owe this vendor right now".
create table if not exists public.vendor_ledger (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  vendor_id     uuid not null references public.vendors(id),
  sub_order_id  uuid references public.sub_orders(id) on delete set null,
  payout_id     uuid references public.vendor_payouts(id) on delete set null,
  type          text not null check (type in
                  ('sale','commission','cod_fee','refund','return','adjustment','payout')),
  amount        numeric(12,2) not null,           -- signed: credits +, debits -
  balance_after numeric(12,2) not null,
  note          text,
  created_at    timestamptz not null default now()
);

create index if not exists vendor_ledger_vendor_idx on public.vendor_ledger (vendor_id, created_at desc);
create index if not exists vendor_ledger_tenant_idx on public.vendor_ledger (tenant_id, created_at desc);
create index if not exists vendor_ledger_suborder_idx on public.vendor_ledger (sub_order_id) where sub_order_id is not null;

-- ─── Shipping: platform-set flat rates per sub-order ───────────────────
-- BD buyer expectation is a flat inside-Dhaka / outside-Dhaka charge, set by
-- the platform rather than per vendor, applied once per vendor parcel.
create table if not exists public.shipping_rates (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  name          text not null,
  name_bn       text,
  areas         text[] not null default '{}',
  rate          numeric(10,2) not null default 0,
  free_above    numeric(12,2),
  cod_fee_pct   numeric(5,2) not null default 1.00,
  eta_days      text,
  is_default    boolean not null default false,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists shipping_rates_tenant_idx on public.shipping_rates (tenant_id, sort_order);

-- ─── RLS ──────────────────────────────────────────────────────────────
alter table public.sub_orders     enable row level security;
alter table public.vendor_payouts enable row level security;
alter table public.vendor_ledger  enable row level security;
alter table public.shipping_rates enable row level security;

-- Staff see everything in their tenant; vendors see only their own rows.
drop policy if exists sub_orders_tenant_all on public.sub_orders;
create policy sub_orders_tenant_all on public.sub_orders
  for all using (public.is_super_admin() or public.is_tenant_member(tenant_id))
  with check (public.is_super_admin() or public.is_tenant_member(tenant_id));

drop policy if exists sub_orders_vendor_read on public.sub_orders;
create policy sub_orders_vendor_read on public.sub_orders
  for select using (public.owns_vendor(vendor_id));

-- Vendors may advance fulfilment on their own sub-orders. Money columns are
-- guarded by a trigger below, not by RLS — a WITH CHECK cannot compare a
-- column against its own previous value.
drop policy if exists sub_orders_vendor_update on public.sub_orders;
create policy sub_orders_vendor_update on public.sub_orders
  for update using (public.owns_vendor(vendor_id))
  with check (public.owns_vendor(vendor_id));

drop policy if exists vendor_payouts_tenant_all on public.vendor_payouts;
create policy vendor_payouts_tenant_all on public.vendor_payouts
  for all using (public.is_super_admin() or public.is_tenant_member(tenant_id))
  with check (public.is_super_admin() or public.is_tenant_member(tenant_id));

drop policy if exists vendor_payouts_vendor_read on public.vendor_payouts;
create policy vendor_payouts_vendor_read on public.vendor_payouts
  for select using (public.owns_vendor(vendor_id));

-- Ledger is append-only and written by service-role code paths only.
drop policy if exists vendor_ledger_tenant_read on public.vendor_ledger;
create policy vendor_ledger_tenant_read on public.vendor_ledger
  for select using (public.is_super_admin() or public.is_tenant_member(tenant_id));

drop policy if exists vendor_ledger_vendor_read on public.vendor_ledger;
create policy vendor_ledger_vendor_read on public.vendor_ledger
  for select using (public.owns_vendor(vendor_id));

drop policy if exists shipping_rates_public_read on public.shipping_rates;
create policy shipping_rates_public_read on public.shipping_rates
  for select using (true);

drop policy if exists shipping_rates_tenant_all on public.shipping_rates;
create policy shipping_rates_tenant_all on public.shipping_rates
  for all using (public.is_super_admin() or public.is_tenant_member(tenant_id))
  with check (public.is_super_admin() or public.is_tenant_member(tenant_id));

-- ─── Guard: vendors may move fulfilment fields, never money ────────────
create or replace function public.sub_orders_vendor_guard()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  -- Trusted server paths bypass the guard. auth.uid() is null for the service
  -- role and for direct postgres connections, which is how the checkout and
  -- payout code writes these rows; those callers are already authorised in
  -- application code. The guard exists specifically to stop a signed-in
  -- vendor rewriting their own economics.
  if auth.uid() is null
     or public.is_super_admin()
     or public.is_tenant_member(new.tenant_id) then
    new.updated_at := now();
    return new;
  end if;

  if public.owns_vendor(new.vendor_id) then
    if new.subtotal          is distinct from old.subtotal
    or new.shipping_cost     is distinct from old.shipping_cost
    or new.discount          is distinct from old.discount
    or new.total             is distinct from old.total
    or new.commission_rate   is distinct from old.commission_rate
    or new.commission_amount is distinct from old.commission_amount
    or new.vendor_earning    is distinct from old.vendor_earning
    or new.cod_amount        is distinct from old.cod_amount
    or new.cod_collected     is distinct from old.cod_collected
    or new.payout_id         is distinct from old.payout_id
    or new.items             is distinct from old.items
    or new.vendor_id         is distinct from old.vendor_id
    or new.order_id          is distinct from old.order_id
    then
      raise exception 'Vendors cannot modify order financials';
    end if;
    new.updated_at := now();
    return new;
  end if;

  raise exception 'Not authorised';
end;
$$;

drop trigger if exists sub_orders_vendor_guard_trg on public.sub_orders;
create trigger sub_orders_vendor_guard_trg
  before update on public.sub_orders
  for each row execute function public.sub_orders_vendor_guard();

-- ─── Sub-order numbering ──────────────────────────────────────────────
create sequence if not exists public.sub_order_seq start 1000;

create or replace function public.next_sub_order_number(prefix text default 'SO')
returns text
language sql volatile set search_path = public
as $$
  select prefix || '-' || to_char(now(), 'YYMM') || '-' || nextval('public.sub_order_seq');
$$;

grant execute on function public.next_sub_order_number(text) to authenticated, service_role;
