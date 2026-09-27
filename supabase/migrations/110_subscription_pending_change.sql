-- A plan change started while a subscription is live is parked here until
-- payment lands (lib/billing/activate.ts), instead of overwriting the live
-- row with status 'pending' — an abandoned upgrade used to knock a paying
-- customer out of renewal/dunning tracking.
alter table public.subscriptions
  add column if not exists pending_plan_id text,
  add column if not exists pending_billing_cycle text,
  add column if not exists pending_amount_cents integer,
  add column if not exists pending_currency text;
