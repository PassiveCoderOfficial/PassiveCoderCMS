-- Pin the live root domain to a snapshot tenant while the root tenant
-- (beta.passivecoder.com) is redesigned. Null = use ROOT_TENANT_SLUG.
alter table homepage_settings add column if not exists live_root_slug text;
