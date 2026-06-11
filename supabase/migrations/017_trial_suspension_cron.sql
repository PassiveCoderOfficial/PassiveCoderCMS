-- Enable pg_cron and schedule hourly trial suspension job.
-- Runs at the top of every hour; flips trial → suspended when trial_ends_at is past.

CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'suspend-expired-trials',
  '0 * * * *',
  $$
    UPDATE subscriptions
    SET status = 'suspended', updated_at = now()
    WHERE status = 'trial'
      AND trial_ends_at IS NOT NULL
      AND trial_ends_at < now();
  $$
);
