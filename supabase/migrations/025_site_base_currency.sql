-- Site-wide base currency, read by BOTH the ecommerce and accounting systems.
-- One source of truth on site_settings (per tenant).

ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS currency          text NOT NULL DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS currency_symbol   text NOT NULL DEFAULT '$',
  ADD COLUMN IF NOT EXISTS currency_position text NOT NULL DEFAULT 'before';

-- NOTE: ecommerce_settings has no tenant_id (single global row), so a per-tenant
-- backfill is not possible. New currency selection happens on the site Settings
-- page going forward; existing tenants default to USD until they set it.

-- Ensure one site_settings row per tenant so the settings API can upsert by tenant.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'site_settings'::regclass AND conname = 'site_settings_tenant_id_key'
  ) THEN
    ALTER TABLE site_settings ADD CONSTRAINT site_settings_tenant_id_key UNIQUE (tenant_id);
  END IF;
END $$;
