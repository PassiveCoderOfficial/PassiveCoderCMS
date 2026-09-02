-- Visitor counting for the plan allowance.
--
-- Soft cap only: we count visits and warn the owner as they approach the
-- limit. Nothing is auto-charged and nothing is auto-suspended — the published
-- plan allowance becomes real without publishing an overage rate we do not
-- bill.
--
-- Daily counters rather than raw pageview rows. A per-view table on a
-- multi-tenant site is a write-heavy, fast-growing thing to maintain, and a
-- soft cap only ever needs the monthly total.

create table if not exists public.tenant_visit_counters (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  day       date not null,
  views     int  not null default 0,
  primary key (tenant_id, day)
);

create index if not exists idx_tenant_visit_counters_day
  on public.tenant_visit_counters(tenant_id, day desc);

comment on table public.tenant_visit_counters is
  'Daily pageview counts per tenant. Feeds the soft plan allowance; never billed.';

alter table public.tenant_visit_counters enable row level security;

-- Owners can read their own traffic; only the service role writes.
drop policy if exists tvc_read on public.tenant_visit_counters;
create policy tvc_read on public.tenant_visit_counters
  for select using (public.is_super_admin() or public.is_tenant_member(tenant_id));

-- Increment for today. SECURITY DEFINER so the anonymous site visitor path can
-- call it without any table grant of its own.
create or replace function public.bump_tenant_views(t uuid, n int default 1)
returns void language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.tenant_visit_counters (tenant_id, day, views)
  values (t, current_date, n)
  on conflict (tenant_id, day)
  do update set views = public.tenant_visit_counters.views + excluded.views;
end $$;

grant execute on function public.bump_tenant_views(uuid, int) to anon, authenticated;

-- Views so far in the current calendar month, which is the window the plan
-- allowance is stated in.
create or replace function public.tenant_views_this_month(t uuid)
returns int language sql stable
as $$
  select coalesce(sum(views), 0)::int
    from public.tenant_visit_counters
   where tenant_id = t
     and day >= date_trunc('month', current_date)::date
$$;

grant execute on function public.tenant_views_this_month(uuid) to anon, authenticated;

-- Tracks which allowance warning has been sent this month, so the cron does
-- not re-send. Reset when the month rolls over (period column changes).
create table if not exists public.tenant_usage_notices (
  tenant_id  uuid primary key references public.tenants(id) on delete cascade,
  period     date not null,          -- first day of the month the notice covers
  threshold  int  not null,          -- 80 or 100
  notified_at timestamptz not null default now()
);

alter table public.tenant_usage_notices enable row level security;

drop policy if exists tun_read on public.tenant_usage_notices;
create policy tun_read on public.tenant_usage_notices
  for select using (public.is_super_admin() or public.is_tenant_member(tenant_id));
