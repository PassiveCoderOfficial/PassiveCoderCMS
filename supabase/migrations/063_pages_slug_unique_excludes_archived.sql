-- Archiving a page didn't free its slug.
--
-- pages_tenant_slug_unique covers (tenant_id, slug) for every row regardless
-- of status, but applying a template archives the tenant's colliding pages and
-- then inserts the template's versions on those same slugs. The archived rows
-- still held them, so the insert hit a duplicate key and the whole apply threw
-- after the archive had already happened — leaving the site with every page
-- archived and nothing live (freebirdsg was in exactly this state).
--
-- Archived and soft-deleted pages are history: they aren't routable, so they
-- have no claim on a slug. Scoping the index to live rows makes archiving mean
-- what the apply flow already assumed it meant.

DROP INDEX IF EXISTS public.pages_tenant_slug_unique;

CREATE UNIQUE INDEX IF NOT EXISTS pages_tenant_slug_unique
  ON public.pages (tenant_id, slug)
  WHERE tenant_id IS NOT NULL
    AND deleted_at IS NULL
    AND status <> 'archived';
