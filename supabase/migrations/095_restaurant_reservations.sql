-- Restaurant vertical Tier 2, item #2 (docs/business/06-restaurant-vertical.md):
-- table reservations. Deliberately simple for a first cut — a reservation
-- is a time slot + party size + contact info against ONE branch (no
-- specific-table assignment, no live availability engine checking every
-- table's booked windows). Staff still confirm/manage by eye, same as most
-- small restaurants actually run reservations today; a real availability
-- engine is a bigger, separate piece of work if this proves needed.

create table if not exists public.restaurant_reservations (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  branch_id     uuid not null references public.restaurant_branches(id) on delete cascade,
  customer_name text not null,
  customer_phone text not null,
  party_size    int not null check (party_size > 0),
  reserved_at   timestamptz not null,
  status        text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists restaurant_reservations_tenant_time_idx
  on public.restaurant_reservations (tenant_id, reserved_at);

create index if not exists restaurant_reservations_branch_time_idx
  on public.restaurant_reservations (branch_id, reserved_at);

comment on table public.restaurant_reservations is
  'Table-ahead bookings, Tier 2 restaurant vertical. Time slot + party size only, no specific-table assignment or availability engine — staff manage by eye, same as most small restaurants do today.';

alter table public.restaurant_reservations enable row level security;

create policy restaurant_reservations_tenant_manage on public.restaurant_reservations
  for all using (public.is_tenant_member(tenant_id))
  with check (public.is_tenant_member(tenant_id));

-- Public insert allowed (a customer-facing booking request form), same
-- pattern as "Public can create orders" on the orders table — anyone can
-- submit a request, but only staff can read/manage the list back (no
-- select policy for anon/public here, matching restaurant_riders' "nothing
-- outside the tenant's own dashboard ever needs to read this" reasoning).
create policy restaurant_reservations_public_insert on public.restaurant_reservations
  for insert
  with check (true);

create trigger set_restaurant_reservations_updated_at
  before update on public.restaurant_reservations
  for each row execute function public.set_updated_at();
