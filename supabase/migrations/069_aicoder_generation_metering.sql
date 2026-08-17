-- AiCoder metering: generation-count based (not token-based). GLM-4.6 is
-- cheap enough (~$0.001/generation) that precise token accounting isn't
-- worth the complexity — a simple monthly counter with hard-stop protects
-- margin just as well and is far easier for customers to understand
-- ("50 AI generations included") than a token/credit balance.

ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS ai_generations_used_this_month integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_generations_reset_at timestamptz NOT NULL DEFAULT (date_trunc('month', now()) + interval '1 month'),
  -- Purchased top-up pool — never expires, never resets monthly. Drained
  -- only after the plan's included monthly quota is exhausted.
  ADD COLUMN IF NOT EXISTS ai_generations_purchased integer NOT NULL DEFAULT 0;

-- Per-plan included monthly generation count lives in plans.modules.ai_coder
-- (jsonb, alongside included/defaultOn) — no new column needed there, just
-- a new key read by the app: modules->'ai_coder'->>'monthly_generations'.
UPDATE plans
SET modules = jsonb_set(modules, '{ai_coder,monthly_generations}', '0'::jsonb)
WHERE id = 'basic';

UPDATE plans
SET modules = jsonb_set(modules, '{ai_coder,monthly_generations}', '50'::jsonb)
WHERE id = 'pro';

UPDATE plans
SET modules = jsonb_set(modules, '{ai_coder,monthly_generations}', '200'::jsonb)
WHERE id = 'custom';

-- Ledger of individual generations — powers usage history in the UI and
-- gives an audit trail if a tenant disputes their usage count.
CREATE TABLE IF NOT EXISTS ai_generation_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  block_type  text NOT NULL,
  source      text NOT NULL DEFAULT 'quota' CHECK (source IN ('quota', 'purchased')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_generation_log_tenant_id_idx ON ai_generation_log(tenant_id, created_at DESC);

ALTER TABLE ai_generation_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_generation_log_select" ON ai_generation_log;
CREATE POLICY "ai_generation_log_select" ON ai_generation_log
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid())
  );

-- Purchasable top-up packages — SA-managed pricing, mirrors how plans.modules
-- already stores config as jsonb rather than a rigid schema.
CREATE TABLE IF NOT EXISTS ai_generation_packages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  generations     integer NOT NULL CHECK (generations > 0),
  price_usd_cents integer NOT NULL CHECK (price_usd_cents > 0),
  active          boolean NOT NULL DEFAULT true,
  sort_order      integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Starter packages — priced with wide margin (real cost ~$0.001/generation,
-- these prices are what customers see and pay, not a cost passthrough).
-- SA can edit/add more via the Plans admin later; this just seeds sane
-- defaults so the purchase flow has something to sell on day one.
INSERT INTO ai_generation_packages (name, generations, price_usd_cents, sort_order)
VALUES
  ('Top-up 50', 50, 900, 1),
  ('Top-up 200', 200, 2900, 2),
  ('Top-up 1000', 1000, 9900, 3)
ON CONFLICT DO NOTHING;
