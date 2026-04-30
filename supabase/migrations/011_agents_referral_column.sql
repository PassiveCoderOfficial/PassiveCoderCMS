-- Migration 011: ensure referred_by_agent_id exists on tenants
-- Safe to run multiple times

ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS referred_by_agent_id uuid REFERENCES agents(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS tenants_referred_by_agent_idx ON tenants(referred_by_agent_id);

-- SECURITY DEFINER fn called by instrumentation.ts on cold start
CREATE OR REPLACE FUNCTION apply_migration_011()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  ALTER TABLE tenants
    ADD COLUMN IF NOT EXISTS referred_by_agent_id uuid REFERENCES agents(id) ON DELETE SET NULL;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'tenants' AND indexname = 'tenants_referred_by_agent_idx'
  ) THEN
    CREATE INDEX tenants_referred_by_agent_idx ON tenants(referred_by_agent_id);
  END IF;
END;
$$;
