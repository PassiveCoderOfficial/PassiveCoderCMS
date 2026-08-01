-- 054_template_engine.sql
-- Ticket 5, Phase 1: DB-backed template engine foundation.
--
-- Extends the existing catalog-only `templates` table (006_templates.sql)
-- with the identity fields a template needs to stand in for a tenant's
-- site_identity (palette, typography, logo, favicon, nav, footer) — a
-- template has no real tenant_id, so it can't reuse site_identity itself
-- (that table is NOT NULL UNIQUE on tenant_id).
--
-- Template PAGES live in the existing `pages` table, exactly like the
-- current root-pages precedent (tenant_id IS NULL rows powering
-- passivecoder.com's own marketing site) — a new nullable template_id
-- column, mutually exclusive with tenant_id.
--
-- No data is touched: existing `templates` rows just gain new nullable
-- columns; the old TEMPLATE_REGISTRY code path is untouched until Phase 3.

begin;

-- ── template_categories ──────────────────────────────────────────────────
-- Global, SA-managed. Staff can request a new one at save-time (status
-- 'pending'); SA approves/renames it later. Matches the existing tenant
-- categorization pattern used elsewhere (service_groups, pricing_groups).
CREATE TABLE IF NOT EXISTS template_categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  slug        text UNIQUE NOT NULL,
  status      text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending')),
  sort_order  integer NOT NULL DEFAULT 0,
  requested_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS template_categories_status_idx ON template_categories(status);

-- ── templates: identity columns ──────────────────────────────────────────
-- Additive only — every new column is nullable/defaulted so the 54
-- existing catalog rows (still read by the old TEMPLATE_REGISTRY-backed
-- flow) are unaffected until Phase 3 migrates them.
ALTER TABLE templates
  ADD COLUMN IF NOT EXISTS category_id     uuid REFERENCES template_categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS owner_id        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status          text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  ADD COLUMN IF NOT EXISTS palette         jsonb,
  ADD COLUMN IF NOT EXISTS typography      jsonb,
  ADD COLUMN IF NOT EXISTS custom_css      text,
  ADD COLUMN IF NOT EXISTS logo_url        text,
  ADD COLUMN IF NOT EXISTS favicon_url     text,
  ADD COLUMN IF NOT EXISTS global_header   jsonb,
  ADD COLUMN IF NOT EXISTS global_footer   jsonb,
  ADD COLUMN IF NOT EXISTS nav_items       jsonb,
  ADD COLUMN IF NOT EXISTS screenshot_url  text,
  ADD COLUMN IF NOT EXISTS source_tenant_id uuid REFERENCES tenants(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at      timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS templates_owner_idx ON templates(owner_id);
CREATE INDEX IF NOT EXISTS templates_status_idx ON templates(status);
CREATE INDEX IF NOT EXISTS templates_category_id_idx ON templates(category_id);

-- ── pages: template ownership ────────────────────────────────────────────
-- A page belongs to a tenant, a template, or neither (root/marketing page)
-- — never both a tenant and a template at once.
ALTER TABLE pages
  ADD COLUMN IF NOT EXISTS template_id uuid REFERENCES templates(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS pages_template_id_idx ON pages(template_id);

ALTER TABLE pages DROP CONSTRAINT IF EXISTS pages_tenant_or_template_exclusive;
ALTER TABLE pages ADD CONSTRAINT pages_tenant_or_template_exclusive
  CHECK (NOT (tenant_id IS NOT NULL AND template_id IS NOT NULL));

-- ── RLS ───────────────────────────────────────────────────────────────────

ALTER TABLE template_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "template_categories_read" ON template_categories;
CREATE POLICY "template_categories_read" ON template_categories
  FOR SELECT USING (status = 'active' OR public.is_super_admin());
DROP POLICY IF EXISTS "template_categories_write" ON template_categories;
CREATE POLICY "template_categories_write" ON template_categories
  FOR ALL USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());
-- Staff (any authenticated user who owns at least one template) can request
-- a new pending category — insert-only, cannot self-approve to 'active'.
DROP POLICY IF EXISTS "template_categories_request" ON template_categories;
CREATE POLICY "template_categories_request" ON template_categories
  FOR INSERT WITH CHECK (status = 'pending' AND requested_by = auth.uid());

-- templates: published rows are publicly readable (showcase/onboarding
-- picker); draft/archived only visible to their owner or any super admin.
DROP POLICY IF EXISTS "templates_public_read" ON templates;
CREATE POLICY "templates_public_read" ON templates
  FOR SELECT USING (
    (status = 'published' AND active = true)
    OR owner_id = auth.uid()
    OR public.is_super_admin()
  );
DROP POLICY IF EXISTS "templates_owner_write" ON templates;
CREATE POLICY "templates_owner_write" ON templates
  FOR ALL USING (owner_id = auth.uid() OR public.is_super_admin())
  WITH CHECK (owner_id = auth.uid() OR public.is_super_admin());

-- pages: extend the existing tenant-scoped policy to also allow the
-- template's owner (or any super admin) to manage template-owned pages.
-- Root/marketing pages (tenant_id AND template_id both null) remain
-- super-admin-only, unchanged from before this migration.
DROP POLICY IF EXISTS "pages_tenant_all" ON pages;
CREATE POLICY "pages_tenant_all" ON pages
  FOR ALL
  USING (
    public.is_super_admin()
    OR (tenant_id IS NOT NULL AND public.is_tenant_member(tenant_id))
    OR (template_id IS NOT NULL AND template_id IN (SELECT id FROM templates WHERE owner_id = auth.uid()))
  )
  WITH CHECK (
    public.is_super_admin()
    OR (tenant_id IS NOT NULL AND public.is_tenant_member(tenant_id))
    OR (template_id IS NOT NULL AND template_id IN (SELECT id FROM templates WHERE owner_id = auth.uid()))
  );

commit;
