-- Add commission_type to agents: 'recurring' (every renewal) or 'one_time' (first payment only)
ALTER TABLE agents
  ADD COLUMN IF NOT EXISTS commission_type text NOT NULL DEFAULT 'recurring'
    CHECK (commission_type IN ('recurring', 'one_time'));
