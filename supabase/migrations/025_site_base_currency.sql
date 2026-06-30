-- Site-wide base currency, read by BOTH the ecommerce and accounting systems.
-- One source of truth on site_settings (per tenant).

ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS currency          text NOT NULL DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS currency_symbol   text NOT NULL DEFAULT '$',
  ADD COLUMN IF NOT EXISTS currency_position text NOT NULL DEFAULT 'before';

-- NOTE: ecommerce_settings has no tenant_id (single global row), so a per-tenant
-- backfill is not possible. New currency selection happens on the site Settings
-- page going forward; existing tenants default to USD until they set it.
