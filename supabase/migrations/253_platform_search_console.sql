-- 253: Search Console managed by the platform's Google account.
-- Most site owners never connect Google, so the platform (the root site's
-- Google connection) can verify and run Search Console for any site:
--   site_settings.platform_google_verification: the platform's own
--     google-site-verification meta tag, rendered next to the owner's.
--   tenant_integrations.gsc_platform: true when the site's Search Console
--     property is owned by the platform account (its token is used for
--     sitemap submits, search data and index checks).
alter table public.site_settings
  add column if not exists platform_google_verification text;

alter table public.tenant_integrations
  add column if not exists gsc_platform boolean not null default false;