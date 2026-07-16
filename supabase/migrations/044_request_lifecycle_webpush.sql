-- 044_request_lifecycle_webpush.sql
-- Request lifecycle + browser push subscriptions.
--
-- Lifecycle: a request stays visible after its deadline (marked red,
-- filterable) and only archives 24h AFTER the deadline passes — losing a
-- request the moment it expires hid genuinely useful posts. Creators can
-- also archive/unarchive by hand.
--
-- Radius: the notify radius is per-request (creator's call), defaulting to
-- 10km rather than the previous hardcoded 25km.

begin;

alter table public.blood_requests
  add column if not exists radius_km int not null default 10
    check (radius_km between 1 and 100),
  add column if not exists archived_at timestamptz;

-- 'archived' joins the existing status set.
alter table public.blood_requests drop constraint if exists blood_requests_status_check;
alter table public.blood_requests add constraint blood_requests_status_check
  check (status in ('open','fulfilled','cancelled','expired','archived'));

create index if not exists blood_requests_archive_idx
  on public.blood_requests(tenant_id, status, needed_by);
create index if not exists blood_requests_creator_idx
  on public.blood_requests(tenant_id, created_by, created_at desc);

-- Browser (Web Push) subscriptions — the web counterpart of donor_devices.
create table if not exists public.donor_web_push (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  donor_id     uuid references public.donors(id) on delete cascade,
  endpoint     text not null unique,
  p256dh       text not null,
  auth         text not null,
  last_seen_at timestamptz not null default now(),
  created_at   timestamptz not null default now()
);
create index if not exists donor_web_push_donor_idx on public.donor_web_push(donor_id);
create index if not exists donor_web_push_tenant_idx on public.donor_web_push(tenant_id);

alter table public.donor_web_push enable row level security;
drop policy if exists "donor_web_push_admin_read" on public.donor_web_push;
create policy "donor_web_push_admin_read" on public.donor_web_push for select
  using (public.is_super_admin() or public.is_tenant_member(tenant_id));

commit;
