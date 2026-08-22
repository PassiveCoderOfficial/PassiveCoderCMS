-- 072_admin_app_devices_and_leads_notify.sql
-- Push device registry for the mobile-admin app (apps/mobile-admin), plus
-- the trigger that turns a brand-new CRM contact into a "new lead" push.
--
-- Unlike donor_devices (one donor per device, one tenant), an admin/staff
-- user can belong to several tenants — the token is registered once per
-- device against the user, and push targeting at send-time joins through
-- tenant_members / tenants.owner_id / super_admins to find who to notify.

begin;

create table if not exists public.admin_app_devices (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  expo_token   text not null unique,
  platform     text check (platform in ('android', 'ios')),
  last_seen_at timestamptz not null default now(),
  created_at   timestamptz not null default now()
);
create index if not exists admin_app_devices_user_idx on public.admin_app_devices(user_id);

alter table public.admin_app_devices enable row level security;

-- A user manages only their own device rows (register/unregister on
-- login/logout); reads for push-sending happen server-side via the
-- service role, not through this policy.
drop policy if exists "admin_app_devices_own" on public.admin_app_devices;
create policy "admin_app_devices_own" on public.admin_app_devices for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

commit;
