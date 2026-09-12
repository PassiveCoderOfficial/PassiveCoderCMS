-- Restaurant vertical, phase 4: rider assignment + delivery status
-- (docs/business/06-restaurant-vertical.md). Locked 2026-09-12: riders are
-- scoped per-branch, not shared across a tenant's branches.

-- ─── Riders ─────────────────────────────────────────────────────────────
-- Deliberately NOT tied to auth.users / tenant_members. A rider assigned
-- from the kitchen screen is usually a name and a phone number, not
-- someone who logs into the dashboard — forcing a real account per rider
-- would be real friction for zero benefit at this scope (no live GPS, no
-- rider-facing app, just "who's got this order" for the owner to answer
-- without calling around). If a rider portal is ever built, add auth
-- separately rather than retrofitting this table.
create table if not exists public.restaurant_riders (
  id          uuid primary key default gen_random_uuid(),
  branch_id   uuid not null references public.restaurant_branches(id) on delete cascade,
  name        text not null,
  phone       text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create index if not exists restaurant_riders_branch_idx
  on public.restaurant_riders (branch_id, is_active);

alter table public.restaurant_riders enable row level security;

create policy restaurant_riders_tenant_manage on public.restaurant_riders
  for all using (
    exists (select 1 from public.restaurant_branches b
            where b.id = branch_id and public.is_tenant_member(b.tenant_id))
  )
  with check (
    exists (select 1 from public.restaurant_branches b
            where b.id = branch_id and public.is_tenant_member(b.tenant_id))
  );
-- No public-read policy, matching the fix in 088: nothing outside the
-- tenant's own dashboard ever needs to read a rider row.

-- ─── Delivery status on orders ──────────────────────────────────────────
-- Independent of kitchen_status on purpose. kitchen_status tracks the food
-- (new/preparing/ready/served/completed); delivery_status tracks the trip
-- once the food is ready and handed off. A pickup or dine-in order has no
-- delivery leg at all, so this stays null for both — it only ever applies
-- to fulfillment_type = 'delivery'.
alter table public.orders
  add column if not exists rider_id uuid references public.restaurant_riders(id) on delete set null,
  add column if not exists delivery_status text
    check (delivery_status in ('assigned','picked_up','delivered') or delivery_status is null);

comment on column public.orders.delivery_status is
  'Delivery trip status, independent of kitchen_status. Null unless fulfillment_type=''delivery'' and a rider has been assigned.';

create index if not exists orders_rider_idx on public.orders (rider_id)
  where rider_id is not null;
