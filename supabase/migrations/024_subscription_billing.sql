-- 024_subscription_billing.sql
-- Payments ledger + per-payment receipts + subscription statement totals.
-- Base currency is USD; BDT payments are converted to USD at usd_to_bdt_rate
-- and applied against the USD balance. Ledger keeps the original paid currency.

begin;

-- ── Receipt numbering (R-YYYY-NNNN, sequential per year, atomic) ─────────────
create table if not exists public.receipt_counters (
  year     int primary key,
  last_seq int not null default 0
);

create or replace function public.next_receipt_number() returns text
language plpgsql security definer set search_path = public as $$
declare y int := extract(year from now())::int; seq int;
begin
  insert into public.receipt_counters(year, last_seq) values (y, 1)
    on conflict (year) do update set last_seq = public.receipt_counters.last_seq + 1
    returning last_seq into seq;
  return 'R-' || y || '-' || lpad(seq::text, 4, '0');
end $$;

-- ── Payments ledger ─────────────────────────────────────────────────────────
create table if not exists public.subscription_payments (
  id                uuid primary key default gen_random_uuid(),
  tenant_id         uuid not null references public.tenants(id) on delete cascade,
  subscription_id   uuid not null references public.subscriptions(id) on delete cascade,
  receipt_number    text unique not null,
  amount_cents      integer not null check (amount_cents > 0),   -- USD cents applied to balance
  currency          text not null default 'USD' check (currency in ('USD','BDT')),
  orig_amount_minor bigint not null,                              -- amount in the paid currency
  fx_rate           numeric(10,4),                                -- usd_to_bdt_rate used (null for USD)
  method            text,
  paid_at           timestamptz not null default now(),
  is_advance        boolean not null default false,
  note              text,
  recorded_by       uuid references auth.users(id),
  emailed_at        timestamptz,
  created_at        timestamptz not null default now()
);

create index if not exists subscription_payments_sub_idx     on public.subscription_payments(subscription_id);
create index if not exists subscription_payments_tenant_idx  on public.subscription_payments(tenant_id);
create index if not exists subscription_payments_paid_at_idx on public.subscription_payments(paid_at);

-- ── Subscription statement totals (the subscription row IS the statement) ────
alter table public.subscriptions
  add column if not exists total_billed_cents integer,
  add column if not exists total_paid_cents   integer not null default 0,
  add column if not exists balance_due_cents  integer generated always as
        (greatest(coalesce(total_billed_cents, 0) - total_paid_cents, 0)) stored;

-- ── RLS: clients read their own tenant's payments; SA full; writes via service role
alter table public.subscription_payments enable row level security;

drop policy if exists "subscription_payments_read" on public.subscription_payments;
create policy "subscription_payments_read" on public.subscription_payments
  for select using (public.is_super_admin() or public.is_tenant_member(tenant_id));

commit;
