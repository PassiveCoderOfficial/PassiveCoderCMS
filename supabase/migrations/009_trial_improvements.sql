-- Migration 009: Trial system improvements
-- Idempotent — safe to run multiple times

-- 1. Unique constraint on subscriptions(tenant_id)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_tenant_id_unique'
  ) THEN
    ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_tenant_id_unique UNIQUE (tenant_id);
  END IF;
END $$;

-- 2. Expand subscriptions.status to include 'suspended'
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_status_check
  CHECK (status IN ('trial','active','past_due','cancelled','expired','suspended'));

-- 3. Helper function called by the app on startup to self-apply this migration
CREATE OR REPLACE FUNCTION apply_migration_009()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Unique constraint
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_tenant_id_unique'
  ) THEN
    ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_tenant_id_unique UNIQUE (tenant_id);
  END IF;

  -- Status check
  ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;
  ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_status_check
    CHECK (status IN ('trial','active','past_due','cancelled','expired','suspended'));
END;
$$;
