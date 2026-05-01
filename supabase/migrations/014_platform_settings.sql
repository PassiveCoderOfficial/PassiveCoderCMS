-- Platform-wide settings editable by super admin

CREATE TABLE IF NOT EXISTS platform_settings (
  id                        integer PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- singleton row
  default_commission_rate   numeric(5,2) NOT NULL DEFAULT 20.00,
  default_commission_type   text NOT NULL DEFAULT 'recurring'
                            CHECK (default_commission_type IN ('recurring', 'one_time')),
  agent_signup_enabled      boolean NOT NULL DEFAULT true,  -- allow /become-agent self-signup
  agent_auto_approve        boolean NOT NULL DEFAULT true,  -- auto-active or pending review
  updated_at                timestamptz NOT NULL DEFAULT now()
);

-- Singleton seed
INSERT INTO platform_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

-- RLS: only super admins can write; public can read
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "platform_settings_read" ON platform_settings;
CREATE POLICY "platform_settings_read" ON platform_settings FOR SELECT USING (true);
