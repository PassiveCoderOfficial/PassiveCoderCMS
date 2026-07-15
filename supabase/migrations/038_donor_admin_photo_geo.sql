-- 038_donor_admin_photo_geo.sql
-- Donor module round 2: admin accounts, profile photos, map coordinates,
-- and per-tenant settings (OTP requirement toggled off until SMS token set).

begin;

alter table public.donors add column if not exists photo_url text;
alter table public.donors add column if not exists lat double precision;
alter table public.donors add column if not exists lng double precision;
alter table public.donors add column if not exists is_admin boolean not null default false;

create table if not exists public.donor_settings (
  tenant_id    uuid primary key references public.tenants(id) on delete cascade,
  otp_required boolean not null default false,
  updated_at   timestamptz not null default now()
);

alter table public.donor_settings enable row level security;
drop policy if exists "donor_settings_admin_read" on public.donor_settings;
create policy "donor_settings_admin_read" on public.donor_settings for select
  using (public.is_super_admin() or public.is_tenant_member(tenant_id));

commit;
