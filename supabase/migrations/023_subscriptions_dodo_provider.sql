-- 023_subscriptions_dodo_provider.sql
-- Allow 'dodo' as a payment_provider on subscriptions. The original CHECK only
-- permitted paddle/shurjopay/manual/trial, so Dodo checkout failed on upsert.

begin;

alter table public.subscriptions drop constraint if exists subscriptions_payment_provider_check;
alter table public.subscriptions add constraint subscriptions_payment_provider_check
  check (payment_provider = any (array['paddle','shurjopay','dodo','manual','trial']));

commit;
