-- ── Support Departments ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS support_departments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  slug        text NOT NULL UNIQUE,
  description text,
  is_active   boolean NOT NULL DEFAULT true,
  sort_order  int NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Seed default departments
INSERT INTO support_departments (name, slug, description, sort_order) VALUES
  ('General Support', 'support', 'General product help and troubleshooting', 0),
  ('Sales',           'sales',   'Pre-sales questions and demos',           1),
  ('Billing',         'billing', 'Invoices, payments, and subscriptions',   2),
  ('General',         'general', 'Everything else',                         3)
ON CONFLICT (slug) DO NOTHING;

-- Add attachments column to support_tickets
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS attachments text[] NOT NULL DEFAULT '{}';

-- Allow super admins to manage departments
ALTER TABLE support_departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admins_manage_departments" ON support_departments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid())
  );

CREATE POLICY "everyone_read_departments" ON support_departments
  FOR SELECT USING (is_active = true);
