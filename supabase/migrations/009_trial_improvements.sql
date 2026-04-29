-- Trial system improvements
-- 1. Unique constraint on subscriptions(tenant_id) for upsert support
-- 2. Add 'suspended' to subscriptions status enum

-- Unique constraint (one active subscription per tenant)
ALTER TABLE subscriptions
  ADD CONSTRAINT IF NOT EXISTS subscriptions_tenant_id_unique UNIQUE (tenant_id);

-- Allow 'suspended' status on subscriptions
ALTER TABLE subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_status_check;

ALTER TABLE subscriptions
  ADD CONSTRAINT subscriptions_status_check
  CHECK (status IN ('trial','active','past_due','cancelled','expired','suspended'));

-- Default trial_ends_at to 7 days from now when not set on tenants
-- (existing rows without trial_ends_at will stay NULL — SA can set via edit page)
