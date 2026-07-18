-- Tenant-initiated site deletion requests: flag only, SA reviews & deletes manually.
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS deletion_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS deletion_requested_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS tenants_deletion_requested_idx ON tenants(deletion_requested_at) WHERE deletion_requested_at IS NOT NULL;
