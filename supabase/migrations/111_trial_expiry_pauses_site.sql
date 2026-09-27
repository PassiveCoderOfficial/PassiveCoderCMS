-- Trial expiry now pauses the site too (tenants.status = 'suspended'), the
-- same state dunning and ended subscriptions use, so the proxy shows the
-- visitor "temporarily unavailable" page and the dashboard shows the renew
-- overlay. Previously only the subscription row changed, which nothing
-- enforced.
select cron.unschedule('suspend-expired-trials');
select cron.schedule('suspend-expired-trials', '0 * * * *', $$
  with expired as (
    update subscriptions set status = 'suspended', updated_at = now()
    where status = 'trial' and trial_ends_at is not null and trial_ends_at < now()
    returning tenant_id
  )
  update tenants set status = 'suspended'
  where id in (select tenant_id from expired) and status in ('active', 'onboarded');
$$);
