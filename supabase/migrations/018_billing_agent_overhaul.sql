-- ── 018: Billing + Agent overhaul ────────────────────────────────────────────
-- 1. tenant_number (T1001 display ID)
-- 2. Subscription: new statuses, custom amount, extra billing fields
-- 3. Agents: is_staff, one_time_pct_override, staff_recurring_pct, per-site commission overrides
-- 4. agent_commissions: commission_type, payment_amount, month_number
-- 5. platform_settings: new commission defaults
-- 6. tenants: assigned_agent_id (support staff), commission overrides

-- ── 1. Tenant number ─────────────────────────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS tenant_number_seq START 1001;

ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS tenant_number integer UNIQUE DEFAULT nextval('tenant_number_seq');

-- Backfill existing tenants (order by created_at so numbers are consistent)
DO $$
DECLARE
  r RECORD;
  n integer;
BEGIN
  FOR r IN SELECT id FROM tenants WHERE tenant_number IS NULL ORDER BY created_at LOOP
    n := nextval('tenant_number_seq');
    UPDATE tenants SET tenant_number = n WHERE id = r.id;
  END LOOP;
END $$;

-- ── 2. Subscriptions ─────────────────────────────────────────────────────────

-- Drop old status constraint, add new statuses
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;
ALTER TABLE subscriptions
  ADD CONSTRAINT subscriptions_status_check
  CHECK (status IN ('onboarded','pending','active','past_due','suspended','cancelled','expired'));

-- Rename trial → onboarded for existing rows
UPDATE subscriptions SET status = 'onboarded' WHERE status = 'trial';

-- New billing fields
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS custom_amount_cents   integer,           -- SA override price
  ADD COLUMN IF NOT EXISTS discount_pct          numeric(5,2),      -- % discount applied
  ADD COLUMN IF NOT EXISTS notes                 text,              -- SA internal notes
  ADD COLUMN IF NOT EXISTS next_payment_due      date,              -- manually set
  ADD COLUMN IF NOT EXISTS last_paid_at          timestamptz,
  ADD COLUMN IF NOT EXISTS payment_method        text;              -- bkash/nagad/bank/shurjopay/card

-- Also update tenants.status to remove 'trial', add new statuses
ALTER TABLE tenants DROP CONSTRAINT IF EXISTS tenants_status_check;
ALTER TABLE tenants
  ADD CONSTRAINT tenants_status_check
  CHECK (status IN ('onboarded','active','suspended','cancelled','enm_pending'));

UPDATE tenants SET status = 'onboarded' WHERE status = 'trial';

-- ── 3. Agents ─────────────────────────────────────────────────────────────────

ALTER TABLE agents
  ADD COLUMN IF NOT EXISTS is_staff                  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS one_time_pct_override     numeric(5,2),   -- NULL = use platform default
  ADD COLUMN IF NOT EXISTS staff_recurring_pct       numeric(5,2);   -- NULL = use platform default (staff only)

-- Per-site commission overrides on tenants
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS agent_commission_override      numeric(5,2),  -- NULL = use agent/platform default
  ADD COLUMN IF NOT EXISTS staff_commission_override      numeric(5,2);  -- NULL = use agent/platform default

-- assigned_agent_id already exists (referred_by_agent_id). Add separate staff_agent_id.
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS staff_agent_id uuid REFERENCES agents(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS tenants_staff_agent_idx ON tenants(staff_agent_id);

-- ── 4. agent_commissions ─────────────────────────────────────────────────────

ALTER TABLE agent_commissions
  ADD COLUMN IF NOT EXISTS commission_type   text NOT NULL DEFAULT 'one_time'
    CHECK (commission_type IN ('one_time', 'recurring')),
  ADD COLUMN IF NOT EXISTS payment_amount    numeric(10,2),  -- the payment that triggered this
  ADD COLUMN IF NOT EXISTS month_number      integer,        -- 1 = first payment, 2+ = recurring
  ADD COLUMN IF NOT EXISTS billing_cycle     text,           -- 'monthly' | 'yearly'
  ADD COLUMN IF NOT EXISTS paid_at           timestamptz;

-- ── 5. platform_settings ─────────────────────────────────────────────────────

ALTER TABLE platform_settings
  ADD COLUMN IF NOT EXISTS default_agent_one_time_pct    numeric(5,2) NOT NULL DEFAULT 10.00,
  ADD COLUMN IF NOT EXISTS default_staff_recurring_pct   numeric(5,2) NOT NULL DEFAULT 10.00,
  -- payment gateway fields (already may exist)
  ADD COLUMN IF NOT EXISTS bkash_number                  text,
  ADD COLUMN IF NOT EXISTS nagad_number                  text,
  ADD COLUMN IF NOT EXISTS bank_details                  text,
  ADD COLUMN IF NOT EXISTS manual_payment_instructions   text;

-- Seed defaults
UPDATE platform_settings SET
  default_agent_one_time_pct  = 10.00,
  default_staff_recurring_pct = 10.00
WHERE id = 1;
