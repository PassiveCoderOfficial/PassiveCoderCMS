-- Fix pages slug uniqueness: the original schema had a global unique constraint
-- on slug, which means only one tenant can have a "home" page. Replace it with
-- a per-tenant unique constraint so each tenant can have its own slug namespace.

-- Drop the global unique constraint on slug
ALTER TABLE public.pages DROP CONSTRAINT IF EXISTS pages_slug_key;

-- Add composite unique constraint: (tenant_id, slug) for tenant pages.
-- NULL tenant_id = root/marketing page; handled separately below.
-- We use a partial unique index for non-null tenant_id rows, and another
-- partial index for null tenant_id rows (root pages keep slug unique among themselves).

CREATE UNIQUE INDEX IF NOT EXISTS pages_tenant_slug_unique
  ON public.pages (tenant_id, slug)
  WHERE tenant_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS pages_root_slug_unique
  ON public.pages (slug)
  WHERE tenant_id IS NULL;
