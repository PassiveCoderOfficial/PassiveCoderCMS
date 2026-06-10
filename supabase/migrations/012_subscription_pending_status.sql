-- 012_subscription_pending_status.sql
-- Allow 'pending' subscription status for payments awaiting verification
-- (manual bKash/Nagad/bank or an in-flight shurjoPay payment).

begin;

alter table public.subscriptions drop constraint if exists subscriptions_status_check;
alter table public.subscriptions add constraint subscriptions_status_check
  check (status = any (array['trial','pending','active','past_due','cancelled','expired','suspended']));

commit;
