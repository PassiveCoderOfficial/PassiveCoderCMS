-- Template pages need their own slug namespace.
--
-- 016 split pages into two namespaces: per-tenant, and "root" (tenant_id IS
-- NULL) for the marketing site. 054 then introduced template pages, which are
-- also tenant_id IS NULL — so they silently fell into the root namespace and
-- share one global slug space with passivecoder.com's own pages AND with each
-- other. The practical effect: only one page named "home" can exist across
-- every template ever created, so a second template can never have a home
-- page at all.
--
-- Fix: root uniqueness applies only to genuine root pages (no tenant, no
-- template), and template pages get their own (template_id, slug) index.

DROP INDEX IF EXISTS public.pages_root_slug_unique;

CREATE UNIQUE INDEX IF NOT EXISTS pages_root_slug_unique
  ON public.pages (slug)
  WHERE tenant_id IS NULL AND template_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS pages_template_slug_unique
  ON public.pages (template_id, slug)
  WHERE template_id IS NOT NULL;
