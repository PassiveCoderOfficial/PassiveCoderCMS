-- Restaurant vertical Tier 2, item #3 (docs/business/06-restaurant-vertical.md):
-- low-stock alert tracking, same shape as tenant_usage_notices
-- (077_visitor_counters.sql) — one row per tenant, tracks what was last
-- notified so the cron (api/cron/low-stock) doesn't re-send every day
-- while the same items stay low.

create table if not exists public.tenant_low_stock_notices (
  tenant_id   uuid primary key references public.tenants(id) on delete cascade,
  signature   text not null,          -- sorted comma-joined product ids currently low, re-fires when this set changes
  notified_at timestamptz not null default now()
);

comment on table public.tenant_low_stock_notices is
  'Tracks the last low-stock product set an owner was emailed about, so the cron only re-notifies when the set of low items actually changes.';

alter table public.tenant_low_stock_notices enable row level security;

create policy tlsn_read on public.tenant_low_stock_notices
  for select using (public.is_super_admin() or public.is_tenant_member(tenant_id));
