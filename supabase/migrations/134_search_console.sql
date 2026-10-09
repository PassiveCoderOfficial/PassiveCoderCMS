-- Google Search Console, connected through the same Google grant as
-- Analytics. Service-role only like the rest of tenant_integrations.
alter table public.tenant_integrations
  add column if not exists google_scopes text,
  add column if not exists gsc_site_url text,
  add column if not exists gsc_verified_at timestamptz,
  add column if not exists gsc_sitemap_at timestamptz,
  add column if not exists gsc_error text,
  add column if not exists gsc_index jsonb;
