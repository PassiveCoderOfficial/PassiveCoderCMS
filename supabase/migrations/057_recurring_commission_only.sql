-- Simplify commission model to recurring-only (drop one-time referral tier).
-- is_staff is no longer a per-agent eligibility flag — every staff member
-- assigned to a tenant via staff_agent_id is commission-eligible once the
-- platform-wide toggle below is on. Off by default.

ALTER TABLE platform_settings
  ADD COLUMN IF NOT EXISTS staff_commission_enabled boolean NOT NULL DEFAULT false;

-- one_time_pct_override, agent_commission_override, default_agent_one_time_pct
-- are left in place (not dropped) — historical agent_commissions rows with
-- commission_type='one_time' still reference this data for records/reporting.
-- Only the code path that CREATES new one-time entries is removed.
