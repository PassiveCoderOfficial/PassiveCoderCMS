-- Dunning: failed-payment and overdue-renewal recovery.
--
-- Monthly billing (adopted 2026-09-02) makes this urgent in a way annual did
-- not — a card fails roughly 12x more often. Before this there was no retry, no
-- reminder and no suspension path: a subscription whose payment stopped simply
-- stayed "active" forever.

-- Per-subscription dunning state. One row per subscription, created lazily by
-- the cron when a subscription first goes overdue.
create table if not exists public.subscription_dunning (
  subscription_id  uuid primary key references public.subscriptions(id) on delete cascade,
  tenant_id        uuid not null references public.tenants(id) on delete cascade,

  -- Which reminder was last sent (0 = none yet). Drives the schedule and makes
  -- the cron idempotent: re-running it the same day sends nothing twice.
  stage            int not null default 0,
  last_notified_at timestamptz,

  -- The due date this dunning run is about. When the subscription is paid and
  -- the period rolls forward, this no longer matches and the row is cleared,
  -- so a later lapse starts a fresh sequence rather than resuming mid-way.
  due_date         date,

  resolved_at      timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_subscription_dunning_tenant
  on public.subscription_dunning(tenant_id);
create index if not exists idx_subscription_dunning_unresolved
  on public.subscription_dunning(resolved_at) where resolved_at is null;

comment on table public.subscription_dunning is
  'Failed-payment recovery state. One row per subscription, cleared when payment lands.';
comment on column public.subscription_dunning.stage is
  '0 = none sent. 1..N = which reminder in the schedule was last sent.';

alter table public.subscription_dunning enable row level security;

-- Read-only to the tenant; only the service role (cron) writes.
drop policy if exists sd_read on public.subscription_dunning;
create policy sd_read on public.subscription_dunning
  for select using (public.is_super_admin() or public.is_tenant_member(tenant_id));

create or replace function public.touch_subscription_dunning()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists trg_touch_subscription_dunning on public.subscription_dunning;
create trigger trg_touch_subscription_dunning
  before update on public.subscription_dunning
  for each row execute function public.touch_subscription_dunning();

-- past_due is a real state the UI already knows how to render (STATUS_CONFIG),
-- but nothing ever set it. The dunning cron does now.
