-- Templates: central registry of available site templates
-- Each row is one template that can be imported (theme-only or full-demo) by a tenant.

CREATE TABLE IF NOT EXISTS templates (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text UNIQUE NOT NULL,
  name          text NOT NULL,
  description   text NOT NULL DEFAULT '',
  category      text NOT NULL,
  tags          text[] NOT NULL DEFAULT '{}',
  gradient      text NOT NULL DEFAULT '',
  thumb_from    text NOT NULL DEFAULT '#6366f1',
  thumb_to      text NOT NULL DEFAULT '#a855f7',
  accent_color  text NOT NULL DEFAULT '#f97316',
  pages         integer NOT NULL DEFAULT 4,
  has_demo      boolean NOT NULL DEFAULT false,
  featured      boolean NOT NULL DEFAULT false,
  badge         text,
  hero_headline text NOT NULL DEFAULT '',
  hero_subline  text NOT NULL DEFAULT '',
  sort_order    integer NOT NULL DEFAULT 0,
  active        boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS templates_slug_idx ON templates(slug);
CREATE INDEX IF NOT EXISTS templates_category_idx ON templates(category);
CREATE INDEX IF NOT EXISTS templates_active_idx ON templates(active);

-- Tenant template imports — log which template each tenant used and which mode
CREATE TABLE IF NOT EXISTS tenant_template_imports (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  template_id uuid REFERENCES templates(id) ON DELETE SET NULL,
  template_slug text NOT NULL,
  mode        text NOT NULL DEFAULT 'full' CHECK (mode IN ('theme', 'full')),
  applied_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tti_tenant_idx ON tenant_template_imports(tenant_id);

-- Allow public read on templates (shown on marketing page)
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "templates_public_read" ON templates;
CREATE POLICY "templates_public_read" ON templates FOR SELECT USING (active = true);

-- Tenant members can read their own imports
ALTER TABLE tenant_template_imports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tti_tenant_read" ON tenant_template_imports;
CREATE POLICY "tti_tenant_read" ON tenant_template_imports FOR SELECT USING (
  tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid())
);
DROP POLICY IF EXISTS "tti_tenant_write" ON tenant_template_imports;
CREATE POLICY "tti_tenant_write" ON tenant_template_imports FOR ALL USING (
  tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid())
);
