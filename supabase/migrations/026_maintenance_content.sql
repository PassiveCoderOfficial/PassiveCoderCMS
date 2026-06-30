-- Dedicated maintenance-screen content, separate from SEO meta fields.
ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS maintenance_title   text,
  ADD COLUMN IF NOT EXISTS maintenance_message text;
