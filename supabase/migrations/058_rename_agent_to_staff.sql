-- Rename platform-level "agents" -> "pc_staff" (Passive Coder's own staff/
-- team, not a tenant's employees), and the pre-existing tenant-employee
-- "staff" table (Jobs & Staff module) -> "tenant_team" to avoid the name
-- collision. Postgres RENAME preserves FKs, indexes, RLS policies, and
-- data — pure naming change, no data migration.

-- ── Tenant employee roster (Jobs & Staff module): staff -> tenant_team ──
ALTER TABLE staff RENAME TO tenant_team;

-- ── Platform-level agents -> pc_staff ────────────────────────────────────
ALTER TABLE agents RENAME TO pc_staff;
ALTER TABLE agent_commissions RENAME TO pc_staff_commissions;

-- ── Columns on tenants ───────────────────────────────────────────────────
ALTER TABLE tenants RENAME COLUMN assigned_agent_id TO assigned_staff_id;
ALTER TABLE tenants RENAME COLUMN referred_by_agent_id TO referred_by_staff_id;
ALTER TABLE tenants RENAME COLUMN staff_agent_id TO staff_id;
-- agent_commission_override backed the removed one-time-referral tier
-- (migration 057) — no longer read anywhere, drop it.
ALTER TABLE tenants DROP COLUMN IF EXISTS agent_commission_override;

-- ── Columns on pc_staff_commissions (formerly agent_commissions) ────────
ALTER TABLE pc_staff_commissions RENAME COLUMN agent_id TO staff_id;

-- ── platform_settings ────────────────────────────────────────────────────
ALTER TABLE platform_settings RENAME COLUMN agent_signup_enabled TO staff_signup_enabled;
ALTER TABLE platform_settings RENAME COLUMN agent_auto_approve TO staff_auto_approve;
-- default_agent_one_time_pct backed the removed one-time tier — drop it.
ALTER TABLE platform_settings DROP COLUMN IF EXISTS default_agent_one_time_pct;

-- ── homepage_settings (marketing copy fields, not functional logic) ────
ALTER TABLE homepage_settings RENAME COLUMN agent_headline TO staff_headline;
ALTER TABLE homepage_settings RENAME COLUMN agent_subheadline TO staff_subheadline;

-- ── profiles.role ────────────────────────────────────────────────────────
-- role has a CHECK constraint enumerating allowed values. Drop it, update
-- existing 'agent' rows to 'pc_staff', then re-add the constraint with the
-- new allowed value — doing it in this order (not update-after-add) avoids
-- the ADD CONSTRAINT itself failing against not-yet-updated rows.
ALTER TABLE profiles DROP CONSTRAINT profiles_role_check;
UPDATE profiles SET role = 'pc_staff' WHERE role = 'agent';
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role = ANY (ARRAY['admin','editor','author','contributor','subscriber','customer','pc_staff']::text[]));
