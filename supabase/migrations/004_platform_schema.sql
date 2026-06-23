-- Platform schema: plans, subscriptions, super admin, support tickets, homepage settings
-- Safe to run multiple times

-- ── Plans ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS plans (
  id             text PRIMARY KEY, -- 'standard', 'premium', 'custom'
  name           text NOT NULL,
  price_yearly   integer NOT NULL, -- cents (19900 = $199)
  price_monthly  integer NOT NULL DEFAULT 0, -- cents; 0 = monthly not offered
  price_lifetime integer NOT NULL DEFAULT 0, -- cents; 0 = lifetime not offered
  storage_gb     integer NOT NULL,
  domains      integer NOT NULL DEFAULT 1,
  pages_limit  integer NOT NULL DEFAULT -1, -- -1 = unlimited
  support_tier text NOT NULL DEFAULT 'standard', -- 'standard' | 'vip'
  features     jsonb NOT NULL DEFAULT '[]',
  is_active    boolean NOT NULL DEFAULT true,
  sort_order   integer NOT NULL DEFAULT 0
);

-- Add billing-cycle columns to pre-existing tables (no-op if already present)
ALTER TABLE plans ADD COLUMN IF NOT EXISTS price_monthly  integer NOT NULL DEFAULT 0;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS price_lifetime integer NOT NULL DEFAULT 0;

INSERT INTO plans (id, name, price_yearly, price_monthly, price_lifetime, storage_gb, domains, support_tier, features, sort_order) VALUES
('standard', 'Standard', 19900, 1900, 49900, 10, 1, 'standard',
  '["1 .com/.org/.net/.info/.co domain","10GB Storage","Daily backups (7 days)","Page builder","Ecommerce","SSL certificate","Uptime monitoring","Standard support"]',
  1),
('premium', 'Premium', 49900, 4900, 99900, 50, 1, 'vip',
  '["1 domain (any TLD)","50GB Storage","Daily backups (7 days)","Page builder","Ecommerce","SSL certificate","Uptime monitoring","VIP Premium support","Priority queue","White-label option"]',
  2),
('custom', 'Custom', 0, 0, 0, 0, 0, 'vip',
  '["Custom storage","Custom domains","Dedicated support","Custom integrations","SLA guarantee","Onboarding assistance"]',
  3)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price_yearly = EXCLUDED.price_yearly,
  price_monthly = EXCLUDED.price_monthly,
  price_lifetime = EXCLUDED.price_lifetime,
  storage_gb = EXCLUDED.storage_gb,
  domains = EXCLUDED.domains,
  support_tier = EXCLUDED.support_tier,
  features = EXCLUDED.features,
  sort_order = EXCLUDED.sort_order;

-- ── Subscriptions ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS subscriptions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan_id               text NOT NULL REFERENCES plans(id),
  status                text NOT NULL DEFAULT 'trial'
                        CHECK (status IN ('trial','active','past_due','cancelled','expired')),
  payment_provider      text CHECK (payment_provider IN ('paddle','shurjopay','manual','trial')),
  billing_cycle         text NOT NULL DEFAULT 'yearly'
                        CHECK (billing_cycle IN ('monthly','yearly','lifetime')),
  -- Trial window
  trial_ends_at         timestamptz,
  trial_converted       boolean NOT NULL DEFAULT false,
  -- Billing
  current_period_start  timestamptz,
  current_period_end    timestamptz,
  cancelled_at          timestamptz,
  -- Provider IDs
  paddle_subscription_id    text,
  shurjopay_order_id        text,
  manual_ticket_id          uuid,
  -- Amounts
  amount_cents          integer,
  currency              text DEFAULT 'USD',
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS billing_cycle text NOT NULL DEFAULT 'yearly';

CREATE INDEX IF NOT EXISTS subscriptions_tenant_id_idx ON subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON subscriptions(status);

-- ── Super Admin Role ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS super_admins (
  user_id     uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_at  timestamptz NOT NULL DEFAULT now(),
  granted_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ── Support Tickets ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS support_tickets (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Who submitted
  tenant_id     uuid REFERENCES tenants(id) ON DELETE SET NULL, -- null = public contact form
  user_id       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  -- Guest (unauthenticated contact form)
  guest_name    text,
  guest_email   text,
  -- Ticket details
  subject       text NOT NULL,
  body          text NOT NULL,
  department    text NOT NULL DEFAULT 'support'
                CHECK (department IN ('support','sales','billing','general')),
  priority      text NOT NULL DEFAULT 'normal'
                CHECK (priority IN ('low','normal','high','urgent')),
  status        text NOT NULL DEFAULT 'open'
                CHECK (status IN ('open','in_progress','waiting','resolved','closed')),
  -- Assignment
  assigned_to   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  -- Metadata
  source        text NOT NULL DEFAULT 'site_admin'
                CHECK (source IN ('contact_form','site_admin','onboarding','system')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  resolved_at   timestamptz
);

CREATE TABLE IF NOT EXISTS support_ticket_messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id   uuid NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  user_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name text, -- for guest replies or system messages
  body        text NOT NULL,
  is_internal boolean NOT NULL DEFAULT false, -- internal notes (super admin only)
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS support_tickets_tenant_id_idx ON support_tickets(tenant_id);
CREATE INDEX IF NOT EXISTS support_tickets_status_idx ON support_tickets(status);
CREATE INDEX IF NOT EXISTS support_tickets_department_idx ON support_tickets(department);
CREATE INDEX IF NOT EXISTS ticket_messages_ticket_id_idx ON support_ticket_messages(ticket_id);

-- ── Homepage Settings (super admin editable) ──────────────────────────────────

CREATE TABLE IF NOT EXISTS homepage_settings (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Hero
  hero_headline         text NOT NULL DEFAULT 'Beautiful Websites for Local Businesses',
  hero_subheadline      text NOT NULL DEFAULT 'Launch your professional website in minutes. No technical skills needed.',
  hero_cta_text         text NOT NULL DEFAULT 'Start Free Trial',
  hero_cta_url          text NOT NULL DEFAULT '/onboarding',
  hero_secondary_cta    text NOT NULL DEFAULT 'See Pricing',
  -- Social proof
  stat_sites            text NOT NULL DEFAULT '500+',
  stat_businesses       text NOT NULL DEFAULT '12',
  stat_uptime           text NOT NULL DEFAULT '99.9%',
  -- Featured testimonials (json array)
  testimonials          jsonb NOT NULL DEFAULT '[]',
  -- FAQ (json array of {q, a})
  faq                   jsonb NOT NULL DEFAULT '[]',
  -- Announcement bar
  announcement_enabled  boolean NOT NULL DEFAULT false,
  announcement_text     text NOT NULL DEFAULT '',
  announcement_url      text NOT NULL DEFAULT '',
  -- SEO
  meta_title            text NOT NULL DEFAULT 'CMS Studio — Website Builder for Local Businesses',
  meta_description      text NOT NULL DEFAULT 'Professional websites for local service businesses. Easy to use, affordable, and powerful.',
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- Seed one row
INSERT INTO homepage_settings (id) VALUES (gen_random_uuid())
ON CONFLICT DO NOTHING;

-- ── DNS Records (for domains purchased through us) ────────────────────────────

CREATE TABLE IF NOT EXISTS dns_records (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  domain        text NOT NULL,
  record_type   text NOT NULL CHECK (record_type IN ('A','AAAA','CNAME','MX','TXT','NS','SRV')),
  host          text NOT NULL, -- '@', 'www', 'mail', etc.
  value         text NOT NULL,
  ttl           integer NOT NULL DEFAULT 300,
  priority      integer, -- for MX/SRV
  logicbox_id   text, -- LogicBox record ID for updates/deletes
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS dns_records_tenant_domain_idx ON dns_records(tenant_id, domain);

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE homepage_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE dns_records ENABLE ROW LEVEL SECURITY;

-- Plans: public read
DROP POLICY IF EXISTS "plans_public_read" ON plans;
CREATE POLICY "plans_public_read" ON plans FOR SELECT USING (is_active = true);

-- Subscriptions: tenant members can read their own
DROP POLICY IF EXISTS "subscriptions_select" ON subscriptions;
CREATE POLICY "subscriptions_select" ON subscriptions
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid())
  );

-- Super admins: only super admins can read
DROP POLICY IF EXISTS "super_admins_select" ON super_admins;
CREATE POLICY "super_admins_select" ON super_admins
  FOR SELECT USING (user_id = auth.uid());

-- Support tickets: tenant members can read their own; guests see nothing (API handles it)
DROP POLICY IF EXISTS "tickets_select" ON support_tickets;
CREATE POLICY "tickets_select" ON support_tickets
  FOR SELECT USING (
    user_id = auth.uid()
    OR tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "ticket_messages_select" ON support_ticket_messages;
CREATE POLICY "ticket_messages_select" ON support_ticket_messages
  FOR SELECT USING (
    ticket_id IN (
      SELECT id FROM support_tickets
      WHERE user_id = auth.uid()
        OR tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid())
    )
  );

-- Homepage settings: public read
DROP POLICY IF EXISTS "homepage_settings_read" ON homepage_settings;
CREATE POLICY "homepage_settings_read" ON homepage_settings FOR SELECT USING (true);

-- DNS records: tenant members can read
DROP POLICY IF EXISTS "dns_records_select" ON dns_records;
CREATE POLICY "dns_records_select" ON dns_records
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid())
  );
