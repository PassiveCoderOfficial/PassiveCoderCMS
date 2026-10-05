-- Google Tag Manager container per site (GTM-XXXXXXX). Rendered by
-- components/site/google-tag-manager.tsx on every tenant page.
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS gtm_container_id text;
