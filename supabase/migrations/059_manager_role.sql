-- Manager role: a pc_staff account with elevated access to the SA panel,
-- minus the ability to grant/revoke/view other Super Admin accounts. Not a
-- separate role/table — just a flag on pc_staff, checked alongside
-- super_admins membership wherever SA-panel access is gated.
ALTER TABLE pc_staff
  ADD COLUMN IF NOT EXISTS is_manager boolean NOT NULL DEFAULT false;
