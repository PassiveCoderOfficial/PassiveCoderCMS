-- Own-data analytics: daily aggregates per (tenant, path, referrer domain,
-- device type, country), feeding a stats panel comparable in spirit to
-- Google Analytics — visits over time, top pages, top referrers, device and
-- geo split — without a per-visitor row anywhere.
--
-- Deliberately aggregate-only, same reasoning as tenant_visit_counters
-- (077_visitor_counters.sql): no visitor id, no IP, no cookie, no session —
-- just a count bucketed by day and a few coarse dimensions. That keeps this
-- outside cookie-consent territory entirely (nothing here identifies a
-- person or persists across their visits) and keeps write volume bounded —
-- one row per (tenant, day, path, referrer, device, country) combination
-- increments in place, rather than a new row per pageview.

create table if not exists public.page_view_stats (
  tenant_id        uuid not null references public.tenants(id) on delete cascade,
  day              date not null,
  path             text not null,
  -- Registrable domain only ("google.com", "facebook.com"), never the full
  -- referrer URL — a full URL can itself leak query params/tracking-ids
  -- belonging to the referring page, which isn't ours to store.
  referrer_domain  text,
  device_type      text not null default 'unknown' check (device_type in ('desktop', 'mobile', 'tablet', 'unknown')),
  -- Country only, from Vercel's edge geo header where present — no city,
  -- no coordinates, no IP stored at any point.
  country          text,
  views            int  not null default 0,
  primary key (tenant_id, day, path, referrer_domain, device_type, country)
);

create index if not exists idx_page_view_stats_tenant_day
  on public.page_view_stats(tenant_id, day desc);

comment on table public.page_view_stats is
  'Own-data pageview aggregates for the dashboard analytics panel. Aggregate-only by design — no visitor id, no IP, no per-view row.';

alter table public.page_view_stats enable row level security;

drop policy if exists pvs_read on public.page_view_stats;
create policy pvs_read on public.page_view_stats
  for select using (public.is_super_admin() or public.is_tenant_member(tenant_id));

-- Increment for today. SECURITY DEFINER so the anonymous site-visitor path
-- can call it without any table grant of its own — same shape as
-- bump_tenant_views in 077_visitor_counters.sql, which this sits alongside
-- rather than replaces (that one feeds the plan allowance and stays as-is).
-- referrer_domain and country sit in the composite primary key, and Postgres
-- primary-key columns are implicitly NOT NULL — so a direct visit (no
-- referrer, the common case) or a request with no geo header would violate
-- the PK constraint on insert. Coalesced to sentinel values that still read
-- naturally on the dashboard rather than nullable: 'direct' and 'unknown'.
-- (Discovered live: every real call was silently failing this constraint and
-- being swallowed by the caller's own error handling — nothing but a direct
-- client-library test surfaced the actual error.)
create or replace function public.bump_page_view_stats(
  t uuid, p_path text, p_referrer_domain text, p_device_type text, p_country text
)
returns void language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.page_view_stats (tenant_id, day, path, referrer_domain, device_type, country, views)
  values (
    t, current_date, left(p_path, 500),
    coalesce(nullif(p_referrer_domain, ''), 'direct'),
    coalesce(p_device_type, 'unknown'),
    coalesce(nullif(p_country, ''), 'unknown'),
    1
  )
  on conflict (tenant_id, day, path, referrer_domain, device_type, country)
  do update set views = public.page_view_stats.views + 1;
end $$;

grant execute on function public.bump_page_view_stats(uuid, text, text, text, text) to anon, authenticated;

-- Retention: 400 days is enough for a trailing-12-month view plus headroom,
-- without the table growing unbounded on a busy tenant. Pruned by the same
-- daily cron pattern as other scheduled maintenance in this codebase.
create or replace function public.prune_page_view_stats()
returns void language sql
as $$
  delete from public.page_view_stats where day < current_date - interval '400 days';
$$;

grant execute on function public.prune_page_view_stats() to service_role;

-- Phase 2: optional Google Analytics connect. We only ever store the
-- tenant's own GA4 measurement ID and inject gtag.js with it — no OAuth, no
-- Reporting API pull, no GA data ever touches our database. The tenant's own
-- GA account is the source of truth for anyone who wants full GA-parity
-- reporting; we just carry their ID onto their site.
alter table public.site_settings
  add column if not exists ga_measurement_id text;

comment on column public.site_settings.ga_measurement_id is
  'Tenant-owned GA4 Measurement ID (G-XXXXXXX). We inject gtag.js with this; we never read GA data back.';

