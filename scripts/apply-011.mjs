/**
 * Applies migration 011 via Supabase Management API (needs PAT)
 * OR falls back to printing SQL to paste in dashboard.
 *
 * Usage:
 *   SUPABASE_PAT=sbp_xxx node scripts/apply-011.mjs
 *   (or just paste the SQL printed below into the Supabase SQL editor)
 */

const PROJECT_REF = "mljchiaabgvdzdsfobxs";
const PAT = process.env.SUPABASE_PAT;

const SQL = `
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS referred_by_agent_id uuid REFERENCES agents(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS tenants_referred_by_agent_idx ON tenants(referred_by_agent_id);

CREATE OR REPLACE FUNCTION apply_migration_011()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  ALTER TABLE tenants
    ADD COLUMN IF NOT EXISTS referred_by_agent_id uuid REFERENCES agents(id) ON DELETE SET NULL;
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE tablename = 'tenants' AND indexname = 'tenants_referred_by_agent_idx'
  ) THEN
    CREATE INDEX tenants_referred_by_agent_idx ON tenants(referred_by_agent_id);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION apply_migration_010()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  ALTER TABLE homepage_settings
    ADD COLUMN IF NOT EXISTS cta_headline         text NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS cta_subheadline      text NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS features_headline    text NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS features_subheadline text NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS hiw_headline         text NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS hiw_subheadline      text NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS testimonials_headline text NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS agent_headline       text NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS agent_subheadline    text NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS testimonials         jsonb NOT NULL DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS faq                  jsonb NOT NULL DEFAULT '[]';
END;
$$;
`;

if (!PAT) {
  console.log("No SUPABASE_PAT env var. Paste this SQL into:");
  console.log(`https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new\n`);
  console.log(SQL);
  process.exit(0);
}

const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${PAT}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ query: SQL }),
});

const text = await res.text();
if (res.ok) {
  console.log("✅ Migration 011 applied successfully.");
} else {
  console.error("❌ Failed:", res.status, text);
  console.log("\nFallback — paste into Supabase SQL editor:\n");
  console.log(SQL);
}
