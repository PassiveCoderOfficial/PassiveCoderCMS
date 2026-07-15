-- 037_blood_donors.sql
-- Blood donor directory module (first used on blood.passivecoder.com, but
-- tenant-scoped so the donor blocks are reusable by any site).
--
-- A donors row is BOTH a directory entry and (optionally) an account:
--   password_hash set  → the donor (or their creator) can log in with
--   phone + password. created_by points at the donor account that submitted
--   the entry; is_claimed flips when the real donor takes over via OTP.
-- All access goes through service-role API routes — RLS stays closed.

begin;

create table if not exists public.donors (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  name            text not null,
  phone           text not null,             -- normalized +8801XXXXXXXXX
  whatsapp        text,                      -- defaults to phone
  blood_group     text not null check (blood_group in
                  ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  gender          text check (gender in ('male','female','other')),
  religion        text check (religion in
                  ('muslim','hindu','christian','buddhist','other')),
  district        text,
  police_station  text,
  area            text,
  birthdate       date,
  age_years       int check (age_years between 10 and 100),
  last_donated_on date,
  -- account/claim
  password_hash   text,
  phone_verified  boolean not null default false,
  is_claimed      boolean not null default false,
  created_by      uuid references public.donors(id) on delete set null,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (tenant_id, phone)
);

create index if not exists donors_tenant_group_idx on public.donors(tenant_id, blood_group);
create index if not exists donors_tenant_district_idx on public.donors(tenant_id, district);
create index if not exists donors_created_by_idx on public.donors(created_by);

create table if not exists public.donor_otps (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  phone      text not null,
  code_hash  text not null,                  -- sha256(code)
  purpose    text not null check (purpose in ('signup','reset','claim')),
  payload    jsonb not null default '{}',    -- signup form snapshot etc.
  attempts   int not null default 0,
  expires_at timestamptz not null,
  used_at    timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists donor_otps_phone_idx on public.donor_otps(tenant_id, phone, purpose, created_at desc);

alter table public.donors enable row level security;
alter table public.donor_otps enable row level security;

-- Service-role only; tenant admins can view their donors from the dashboard
drop policy if exists "donors_admin_read" on public.donors;
create policy "donors_admin_read" on public.donors for select
  using (public.is_super_admin() or public.is_tenant_member(tenant_id));

commit;
