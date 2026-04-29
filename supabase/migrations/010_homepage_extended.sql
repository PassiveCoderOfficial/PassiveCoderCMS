-- Migration 010: extend homepage_settings with editable section data
-- Safe to run multiple times (IF NOT EXISTS / DO NOTHING)

-- Add new columns to homepage_settings
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
  -- JSON arrays (stored as jsonb)
  ADD COLUMN IF NOT EXISTS testimonials         jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS faq                  jsonb NOT NULL DEFAULT '[]';

-- Function for idempotent migration runner
CREATE OR REPLACE FUNCTION apply_migration_010()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
