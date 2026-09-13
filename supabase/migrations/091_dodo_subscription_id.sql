-- 7-day-trial cancellation (docs/business/04-pricing-and-packaging.md).
-- Discovered while building the dashboard countdown/pay-now/cancel UI:
-- there was no self-serve cancel button anywhere, and no way to build one —
-- we never stored Dodo's own subscription_id on our subscriptions row, so
-- there was nothing to call Dodo's cancel-subscription API against for a
-- specific customer. Captured going forward from the webhook.
alter table public.subscriptions
  add column if not exists dodo_subscription_id text;

create index if not exists subscriptions_dodo_subscription_id_idx
  on public.subscriptions (dodo_subscription_id) where dodo_subscription_id is not null;
