-- Migration 015: Full template identity system
--
-- Adds active_template_slug to site_identity so the site layout can
-- inject the correct CSS variables and block variants at render time.

-- ── site_identity: active template slug ──────────────────────────────────────
ALTER TABLE public.site_identity
  ADD COLUMN IF NOT EXISTS active_template_slug text DEFAULT NULL;

COMMENT ON COLUMN public.site_identity.active_template_slug IS
  'Slug of the currently active TemplateIdentity from the registry. '
  'When set, the site layout injects template CSS vars + block variant keys.';

-- ── service_items: image_url (templates ship with real images per service) ───
ALTER TABLE public.service_items
  ADD COLUMN IF NOT EXISTS image_url text DEFAULT NULL;

COMMENT ON COLUMN public.service_items.image_url IS
  'Optional hero image for a service card (used in image-card variants).';

-- ── testimonials: avatar_url (templates ship with real avatar images) ─────────
ALTER TABLE public.testimonials
  ADD COLUMN IF NOT EXISTS avatar_url text DEFAULT NULL;

COMMENT ON COLUMN public.testimonials.avatar_url IS
  'Optional avatar image URL for a testimonial reviewer.';

-- ── pricing_packages: description + badge (richer pricing display) ───────────────
ALTER TABLE public.pricing_packages
  ADD COLUMN IF NOT EXISTS description text DEFAULT NULL;

ALTER TABLE public.pricing_packages
  ADD COLUMN IF NOT EXISTS badge text DEFAULT NULL;

COMMENT ON COLUMN public.pricing_packages.description IS 'Short description shown under the plan name.';
COMMENT ON COLUMN public.pricing_packages.badge IS 'Optional badge label (e.g. "Most Popular").';

-- ── tenant_template_imports: index for fast lookups ───────────────────────────
CREATE INDEX IF NOT EXISTS idx_tenant_template_imports_tenant_slug
  ON public.tenant_template_imports (tenant_id, template_slug);
