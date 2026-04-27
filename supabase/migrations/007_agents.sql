-- Agent/Developer role system
-- Agents are auto-approved on signup but regulated by super admin

CREATE TABLE IF NOT EXISTS agents (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name         text NOT NULL,
  email             text NOT NULL,
  company           text,
  website           text,
  bio               text,
  status            text NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'suspended', 'pending')),
  commission_rate   numeric(5,2) NOT NULL DEFAULT 20.00, -- percentage
  total_sites       integer NOT NULL DEFAULT 0,
  total_earnings    numeric(10,2) NOT NULL DEFAULT 0.00,
  referral_code     text UNIQUE NOT NULL DEFAULT substr(md5(random()::text), 1, 8),
  notes             text, -- super admin notes
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agents_user_id_idx ON agents(user_id);
CREATE INDEX IF NOT EXISTS agents_status_idx ON agents(status);
CREATE INDEX IF NOT EXISTS agents_referral_code_idx ON agents(referral_code);

-- Track which tenants were referred by which agent
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS referred_by_agent_id uuid REFERENCES agents(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS tenants_referred_by_agent_idx ON tenants(referred_by_agent_id);

-- Commission ledger
CREATE TABLE IF NOT EXISTS agent_commissions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id      uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  tenant_id     uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  amount        numeric(10,2) NOT NULL,
  status        text NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'paid', 'cancelled')),
  description   text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agent_commissions_agent_id_idx ON agent_commissions(agent_id);

-- RLS
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_commissions ENABLE ROW LEVEL SECURITY;

-- Agents can read/update their own row
DROP POLICY IF EXISTS "agents_self_select" ON agents;
CREATE POLICY "agents_self_select" ON agents
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "agents_self_update" ON agents;
CREATE POLICY "agents_self_update" ON agents
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Agents can read their own commissions
DROP POLICY IF EXISTS "agent_commissions_select" ON agent_commissions;
CREATE POLICY "agent_commissions_select" ON agent_commissions
  FOR SELECT USING (
    agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
  );
