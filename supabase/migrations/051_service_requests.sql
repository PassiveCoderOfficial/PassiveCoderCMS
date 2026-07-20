-- 051_service_requests.sql
-- Open service requests — a second, parallel entry point alongside the
-- vendor-pick+slot-booking flow in 050_marketplace.sql. A buyer posts a job
-- (regular or urgent) without choosing a specific vendor; urgent requests
-- notify nearby vendors in escalating waves of 5 every 10 minutes until
-- claimed (see src/app/api/cron/escalate-requests/route.ts).
--
-- Modeled closely on blood_requests (044_request_lifecycle_webpush.sql) —
-- same lazy-archive-on-GET pattern, same haversine-radius vendor matching,
-- same dual web-push approach — but vendors are not donor accounts, so this
-- gets its own vendor_web_push table rather than reusing donor_web_push.

begin;

create table if not exists public.service_requests (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid not null references public.tenants(id) on delete cascade,
  contact_id          uuid references public.contacts(id) on delete set null,
  subcategory_id      uuid references public.service_subcategories(id) on delete set null,
  description         text,
  customer_name       text,
  customer_phone      text,
  address             text,
  lat                 numeric(9,6),
  lng                 numeric(9,6),
  urgency             text not null default 'regular' check (urgency in ('regular','urgent')),
  radius_km           int not null default 15 check (radius_km between 1 and 100),
  status              text not null default 'open'
                      check (status in ('open','claimed','fulfilled','cancelled','archived')),
  claimed_by_vendor_id uuid references public.vendors(id) on delete set null,
  claimed_at          timestamptz,
  -- Escalation state (urgent requests only) — see escalate-requests cron.
  notified_vendor_ids uuid[] not null default '{}',
  notified_count      int not null default 0,
  last_notified_at    timestamptz,
  archived_at         timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists service_requests_tenant_idx
  on public.service_requests(tenant_id, status, urgency);
create index if not exists service_requests_escalation_idx
  on public.service_requests(status, urgency, last_notified_at)
  where status = 'open' and urgency = 'urgent';

-- Browser (Web Push) subscriptions for vendors — the vendor-side counterpart
-- of donor_web_push. Vendors don't have self-serve login in Phase 1 (per
-- 050_marketplace.sql), but vendors.user_id is already nullable/optional for
-- when that lands — the self-manage policy below is future-ready, harmless
-- now since no vendor has a user_id yet.
create table if not exists public.vendor_web_push (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  vendor_id    uuid not null references public.vendors(id) on delete cascade,
  endpoint     text not null unique,
  p256dh       text not null,
  auth         text not null,
  last_seen_at timestamptz not null default now(),
  created_at   timestamptz not null default now()
);
create index if not exists vendor_web_push_vendor_idx on public.vendor_web_push(vendor_id);
create index if not exists vendor_web_push_tenant_idx on public.vendor_web_push(tenant_id);

alter table public.service_requests enable row level security;
alter table public.vendor_web_push  enable row level security;

drop policy if exists "service_requests_read" on public.service_requests;
create policy "service_requests_read" on public.service_requests for select
  using (public.is_super_admin() or public.is_tenant_member(tenant_id));
drop policy if exists "service_requests_write" on public.service_requests;
create policy "service_requests_write" on public.service_requests for all
  using (public.is_super_admin() or public.is_tenant_editor(tenant_id))
  with check (public.is_super_admin() or public.is_tenant_editor(tenant_id));
-- Storefront buyers post requests without a session (same pattern as
-- marketplace_bookings_public_insert in 050_marketplace.sql).
drop policy if exists "service_requests_public_insert" on public.service_requests;
create policy "service_requests_public_insert" on public.service_requests for insert
  with check (true);

drop policy if exists "vendor_web_push_admin_read" on public.vendor_web_push;
create policy "vendor_web_push_admin_read" on public.vendor_web_push for select
  using (public.is_super_admin() or public.is_tenant_member(tenant_id));
-- A vendor with a linked auth user can manage their own subscription rows
-- directly (future-ready for vendor self-serve login; harmless today since
-- no vendor has user_id set yet — see comment above).
drop policy if exists "vendor_web_push_self_manage" on public.vendor_web_push;
create policy "vendor_web_push_self_manage" on public.vendor_web_push for all
  using (public.is_super_admin() or exists (
    select 1 from public.vendors v where v.id = vendor_id and v.user_id = auth.uid()
  ))
  with check (public.is_super_admin() or exists (
    select 1 from public.vendors v where v.id = vendor_id and v.user_id = auth.uid()
  ));

commit;
