-- Tracks whether a tenant has completed (or explicitly skipped) the
-- first-login setup wizard (logo, favicon, site name/description, etc.)
-- shown once on their first dashboard visit.
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS setup_wizard_completed_at timestamptz;
