-- User-made section presets: admins save a container/block composition from
-- the page builder and reuse it across pages. Complements the built-in,
-- code-defined "Global" presets in section-presets.ts.
CREATE TABLE IF NOT EXISTS section_preset_saves (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL,
  blocks jsonb NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS section_preset_saves_tenant_idx ON section_preset_saves(tenant_id);

ALTER TABLE section_preset_saves ENABLE ROW LEVEL SECURITY;

CREATE POLICY section_preset_saves_tenant_all ON section_preset_saves
  FOR ALL
  USING (is_super_admin() OR is_tenant_member(tenant_id))
  WITH CHECK (is_super_admin() OR is_tenant_member(tenant_id));
