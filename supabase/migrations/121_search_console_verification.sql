-- Google Search Console verification token per site (content of the
-- google-site-verification meta tag), rendered by lib/site/site-metadata.ts.
alter table public.site_settings add column if not exists google_site_verification text;
