-- Per-type backup config (DB vs Files, independently schedulable/retainable)
-- and tagging backup_runs with which type they are, so the UI can offer
-- separate DB/Files/Full downloads per run instead of one bundled export.

CREATE TABLE IF NOT EXISTS backup_settings (
  tenant_id           uuid PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  db_enabled          boolean NOT NULL DEFAULT true,
  db_frequency        text NOT NULL DEFAULT 'daily' CHECK (db_frequency IN ('daily','weekly','monthly')),
  db_retention_count  integer NOT NULL DEFAULT 7 CHECK (db_retention_count BETWEEN 1 AND 90),
  files_enabled          boolean NOT NULL DEFAULT true,
  files_frequency        text NOT NULL DEFAULT 'weekly' CHECK (files_frequency IN ('daily','weekly','monthly')),
  files_retention_count  integer NOT NULL DEFAULT 2 CHECK (files_retention_count BETWEEN 1 AND 90),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE backup_runs
  ADD COLUMN IF NOT EXISTS backup_type text NOT NULL DEFAULT 'full' CHECK (backup_type IN ('db','files','full')),
  ADD COLUMN IF NOT EXISTS size_bytes bigint;

ALTER TABLE backup_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "backup_settings_select" ON backup_settings;
CREATE POLICY "backup_settings_select" ON backup_settings
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid())
  );
