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

-- Backfill: many tenants had NO site_settings row because the onboarding upsert's
-- onConflict("tenant_id") silently no-op'd before the UNIQUE constraint above
-- existed. Create a default USD row for every tenant that is still missing one.
INSERT INTO site_settings (tenant_id, currency, currency_symbol, currency_position)
SELECT t.id, 'USD', '$', 'before'
FROM tenants t
WHERE NOT EXISTS (SELECT 1 FROM site_settings s WHERE s.tenant_id = t.id)
ON CONFLICT (tenant_id) DO NOTHING;
