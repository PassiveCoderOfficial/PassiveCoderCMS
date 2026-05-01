-- Agent panel: role expansion, site assignment, primary site tracking

-- 1. Add 'agent' as valid profile role
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin','editor','author','contributor','subscriber','customer','agent'));

-- 2. Add assigned_agent_id to tenants (SA manually assigns agent to site)
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS assigned_agent_id uuid REFERENCES agents(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS tenants_assigned_agent_idx ON tenants(assigned_agent_id);

-- 3. Add is_primary flag to tenant_members (which site is default for multi-site users)
ALTER TABLE tenant_members ADD COLUMN IF NOT EXISTS is_primary boolean NOT NULL DEFAULT false;

-- 4. Ensure only one primary per user (partial unique index)
CREATE UNIQUE INDEX IF NOT EXISTS tenant_members_one_primary_per_user
  ON tenant_members(user_id) WHERE is_primary = true;
