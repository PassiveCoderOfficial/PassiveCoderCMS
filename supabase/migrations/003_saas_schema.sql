-- Multi-tenant SaaS schema
-- Safe to run multiple times (IF NOT EXISTS everywhere)

-- ── Tenants ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tenants (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             text UNIQUE NOT NULL,
  name             text NOT NULL,
  owner_id         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  plan             text NOT NULL DEFAULT 'free',
  status           text NOT NULL DEFAULT 'trial'
                   CHECK (status IN ('trial','active','suspended','cancelled')),
  -- Domain
  custom_domain    text UNIQUE,
  domain_status    text NOT NULL DEFAULT 'none'
                   CHECK (domain_status IN ('none','pending','active','failed')),
  -- Stripe
  stripe_customer_id    text,
  stripe_subscription_id text,
  -- Lifecycle
  onboarding_completed  boolean NOT NULL DEFAULT false,
  trial_ends_at         timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tenants_slug_idx ON tenants(slug);
CREATE INDEX IF NOT EXISTS tenants_custom_domain_idx ON tenants(custom_domain);
CREATE INDEX IF NOT EXISTS tenants_owner_id_idx ON tenants(owner_id);

-- ── Tenant Members ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tenant_members (
  tenant_id  uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       text NOT NULL DEFAULT 'editor'
             CHECK (role IN ('owner','admin','editor','viewer')),
  joined_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, user_id)
);

CREATE INDEX IF NOT EXISTS tenant_members_user_id_idx ON tenant_members(user_id);

-- ── Domain Orders ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS domain_orders (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  domain              text NOT NULL,
  logicbox_order_id   bigint,
  status              text NOT NULL DEFAULT 'pending_dns'
                      CHECK (status IN ('pending_dns','active','failed','expired')),
  dns_type            text NOT NULL DEFAULT 'arecord'
                      CHECK (dns_type IN ('automatic','nameserver','arecord')),
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS domain_orders_tenant_id_idx ON domain_orders(tenant_id);

-- ── Backup Runs ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS backup_runs (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  status         text NOT NULL DEFAULT 'running'
                 CHECK (status IN ('running','complete','failed')),
  storage_path   text,
  error          text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  completed_at   timestamptz
);

CREATE INDEX IF NOT EXISTS backup_runs_tenant_id_idx ON backup_runs(tenant_id);
CREATE INDEX IF NOT EXISTS backup_runs_created_at_idx ON backup_runs(created_at DESC);

-- ── Add tenant_id to all content tables ───────────────────────────────────────

DO $$
DECLARE
  tbl text;
  content_tables text[] := ARRAY[
    'posts','pages','media','products','product_categories',
    'orders','customers','forms','form_submissions',
    'navigation_menus','site_settings','themes','plugins',
    'invoices','tax_rates','delivery_zones','accounting_accounts'
  ];
BEGIN
  FOREACH tbl IN ARRAY content_tables LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = tbl AND table_schema = 'public') THEN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = tbl AND column_name = 'tenant_id' AND table_schema = 'public'
      ) THEN
        EXECUTE format('ALTER TABLE %I ADD COLUMN tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE', tbl);
        EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I(tenant_id)', tbl || '_tenant_id_idx', tbl);
      END IF;
    END IF;
  END LOOP;
END $$;

-- ── Tenant context helpers ────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_tenant_context(p_tenant_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM set_config('app.tenant_id', p_tenant_id::text, true);
END;
$$;

CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN nullif(current_setting('app.tenant_id', true), '')::uuid;
END;
$$;

-- ── RLS Policies ──────────────────────────────────────────────────────────────

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_runs ENABLE ROW LEVEL SECURITY;

-- Members can read their tenant
DROP POLICY IF EXISTS "tenant_select" ON tenants;
CREATE POLICY "tenant_select" ON tenants
  FOR SELECT USING (
    id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid())
  );

-- Owners/admins can update tenant
DROP POLICY IF EXISTS "tenant_update" ON tenants;
CREATE POLICY "tenant_update" ON tenants
  FOR UPDATE USING (
    id IN (
      SELECT tenant_id FROM tenant_members
      WHERE user_id = auth.uid() AND role IN ('owner','admin')
    )
  );

-- Members can read their own rows — direct check avoids self-referential recursion
DROP POLICY IF EXISTS "tenant_members_select" ON tenant_members;
CREATE POLICY "tenant_members_select" ON tenant_members
  FOR SELECT USING (user_id = auth.uid());

-- domain_orders: members of tenant can read
DROP POLICY IF EXISTS "domain_orders_select" ON domain_orders;
CREATE POLICY "domain_orders_select" ON domain_orders
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid())
  );

-- backup_runs: members can read
DROP POLICY IF EXISTS "backup_runs_select" ON backup_runs;
CREATE POLICY "backup_runs_select" ON backup_runs
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid())
  );

-- ── Storage: backups bucket ───────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('backups', 'backups', false, 524288000) -- 500MB
ON CONFLICT (id) DO NOTHING;

-- Only service role can read/write (backups are private)
-- Tenant members can download via signed URLs generated by the API
