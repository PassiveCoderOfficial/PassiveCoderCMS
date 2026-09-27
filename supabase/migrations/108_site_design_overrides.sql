-- Site-wide design settings layered over the active template: fonts,
-- heading weight/tracking, corner roundness, shadow strength.
-- Shape: modules/themes/template-types.ts SiteDesign. NULL = template default.
-- Covered by site_identity's existing RLS (members of the tenant can edit).
alter table public.site_identity
  add column if not exists design_overrides jsonb;
