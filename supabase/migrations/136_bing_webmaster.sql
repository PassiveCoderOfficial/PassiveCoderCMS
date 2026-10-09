-- Bing Webmaster Tools connection (OAuth). Service-role only like the rest of tenant_integrations.
alter table public.tenant_integrations
  add column if not exists bing_refresh_token text,
  add column if not exists bing_access_token text,
  add column if not exists bing_expires_at timestamptz,
  add column if not exists bing_site_url text,
  add column if not exists bing_verified_at timestamptz,
  add column if not exists bing_sitemap_at timestamptz,
  add column if not exists bing_error text;
