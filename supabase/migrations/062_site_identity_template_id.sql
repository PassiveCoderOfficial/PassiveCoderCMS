-- Tenants currently point at their visual identity via
-- site_identity.active_template_slug, resolved against the hardcoded
-- TEMPLATE_REGISTRY in template-registry.ts. That registry is being replaced
-- by the DB-backed templates table (054) built through the new visual
-- template engine — this column is the tenant-side half of that cutover.
--
-- Both columns coexist during migration: (site)/layout.tsx reads template_id
-- first and falls back to active_template_slug + the registry only until
-- every live tenant has been repointed and the registry file is deleted.

ALTER TABLE public.site_identity
  ADD COLUMN IF NOT EXISTS template_id uuid REFERENCES public.templates(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS site_identity_template_id_idx ON public.site_identity(template_id);
