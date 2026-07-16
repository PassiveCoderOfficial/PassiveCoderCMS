-- 042_blood_requests_devices.sql
-- Urgent blood requests + push device registry (for the native app).
--
-- A request is posted by a logged-in donor account, targets a blood group
-- near a location, and is matched against nearby donors to notify. Requests
-- auto-expire (needed_by) rather than lingering forever.

begin;

create table if not exists public.blood_requests (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references public.tenants(id) on delete cascade,
  created_by     uuid references public.donors(id) on delete set null,
  patient_name   text,
  blood_group    text not null check (blood_group in
                 ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  bags_needed    int not null default 1 check (bags_needed between 1 and 20),
  hospital       text,
  district       text,
  police_station text,
  area           text,
  lat            double precision,
  lng            double precision,
  contact_phone  text not null,           -- normalized +8801XXXXXXXXX
  note           text,
  needed_by      timestamptz,             -- when it stops being useful
  status         text not null default 'open'
                 check (status in ('open','fulfilled','cancelled','expired')),
  notified_count int not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists blood_requests_tenant_idx
  on public.blood_requests(tenant_id, status, created_at desc);
create index if not exists blood_requests_group_idx
  on public.blood_requests(tenant_id, blood_group, status);

-- Push device registry. One row per install; refreshed on app launch.
create table if not exists public.donor_devices (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  donor_id     uuid references public.donors(id) on delete cascade,
  expo_token   text not null unique,      -- Expo push token
  platform     text check (platform in ('android','ios','web')),
  last_seen_at timestamptz not null default now(),
  created_at   timestamptz not null default now()
);
create index if not exists donor_devices_tenant_idx on public.donor_devices(tenant_id);
create index if not exists donor_devices_donor_idx on public.donor_devices(donor_id);

alter table public.blood_requests enable row level security;
alter table public.donor_devices  enable row level security;

-- Service-role only (all access goes through API routes); tenant staff read.
drop policy if exists "blood_requests_admin_read" on public.blood_requests;
create policy "blood_requests_admin_read" on public.blood_requests for select
  using (public.is_super_admin() or public.is_tenant_member(tenant_id));

drop policy if exists "donor_devices_admin_read" on public.donor_devices;
create policy "donor_devices_admin_read" on public.donor_devices for select
  using (public.is_super_admin() or public.is_tenant_member(tenant_id));

commit;
