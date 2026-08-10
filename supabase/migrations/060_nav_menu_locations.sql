-- 060_nav_menu_locations.sql
-- Navigation overhaul: make nav_menus the real source of menu DATA, with the
-- navigation block responsible only for PRESENTATION.
--
-- Three problems this addresses:
--
-- 1. seedTemplate upserts nav_menus with onConflict "tenant_id,location", but
--    no `location` column has ever existed. Every template apply has been
--    failing that upsert silently, which is why menus drift out of sync with
--    what a site actually renders.
--
-- 2. There was no way to say "this menu is the header" or "this one is the
--    footer" — so a menu could not be assigned anywhere, and the header block
--    ended up embedding its own private copy of the items instead. Two copies,
--    no link between them, hence the duplicates.
--
-- 3. Menus had no notion of sub-menus in practice. NavItem already supports
--    `children` and navigation-block.tsx already renders dropdowns and mega
--    menus from it, but nothing populated it.
--
-- Existing data is preserved: the 3 menus currently in the table keep their
-- items and are assigned to the header location.

begin;

-- ── location ─────────────────────────────────────────────────────────────
-- Where this menu renders. 'none' lets a menu exist without being live yet,
-- which matters when building a template's menus before its pages exist.
ALTER TABLE nav_menus
  ADD COLUMN IF NOT EXISTS location text NOT NULL DEFAULT 'none';

ALTER TABLE nav_menus DROP CONSTRAINT IF EXISTS nav_menus_location_check;
ALTER TABLE nav_menus ADD CONSTRAINT nav_menus_location_check
  CHECK (location IN ('none', 'header', 'footer', 'footer_secondary', 'mobile', 'sidebar', 'legal'));

-- Existing menus predate locations and were all being used as the site's main
-- nav, so put them where they were already behaving as if they were.
UPDATE nav_menus SET location = 'header' WHERE location = 'none';

-- One menu per location per tenant — this is the constraint seedTemplate's
-- upsert has always assumed. 'none' is exempt: any number of unassigned menus
-- can exist as drafts.
DROP INDEX IF EXISTS nav_menus_tenant_location_unique;
CREATE UNIQUE INDEX nav_menus_tenant_location_unique
  ON nav_menus (tenant_id, location)
  WHERE location <> 'none';

-- ── template ownership ───────────────────────────────────────────────────
-- Templates need their own menus, mirroring how pages.template_id works: a
-- menu belongs to a tenant or to a template, never both.
ALTER TABLE nav_menus
  ADD COLUMN IF NOT EXISTS template_id uuid REFERENCES templates(id) ON DELETE CASCADE;

ALTER TABLE nav_menus ALTER COLUMN tenant_id DROP NOT NULL;

ALTER TABLE nav_menus DROP CONSTRAINT IF EXISTS nav_menus_owner_exclusive;
ALTER TABLE nav_menus ADD CONSTRAINT nav_menus_owner_exclusive
  CHECK (
    (tenant_id IS NOT NULL AND template_id IS NULL)
    OR (tenant_id IS NULL AND template_id IS NOT NULL)
  );

CREATE INDEX IF NOT EXISTS nav_menus_template_id_idx ON nav_menus (template_id);

-- Template menus need their own uniqueness, since tenant_id is null for them
-- and the index above only covers tenant-owned rows.
DROP INDEX IF EXISTS nav_menus_template_location_unique;
CREATE UNIQUE INDEX nav_menus_template_location_unique
  ON nav_menus (template_id, location)
  WHERE template_id IS NOT NULL AND location <> 'none';

-- ── RLS ──────────────────────────────────────────────────────────────────
-- Menus are public read (they render on public sites), writable by tenant
-- members for their own tenant, and by a template's owner for template menus.
ALTER TABLE nav_menus ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "nav_menus_public_read" ON nav_menus;
CREATE POLICY "nav_menus_public_read" ON nav_menus FOR SELECT USING (true);

DROP POLICY IF EXISTS "nav_menus_write" ON nav_menus;
CREATE POLICY "nav_menus_write" ON nav_menus
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
