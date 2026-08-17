-- Page-level snapshots: the safety rail for the upcoming AiCoder feature,
-- and standalone-useful for any bad manual edit today. Captures the PRE-edit
-- blocks state on every meaningful pages.blocks change via a trigger, so
-- every write path (current manual/autosave editor, future AI-driven edits)
-- is covered automatically with no app-code changes required.

CREATE TABLE IF NOT EXISTS page_snapshots (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  page_id     uuid NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  blocks      jsonb NOT NULL,
  title       text,          -- page title at snapshot time, for a readable history list
  reason      text NOT NULL DEFAULT 'edit' CHECK (reason IN ('edit', 'ai_edit', 'restore')),
  created_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS page_snapshots_page_id_idx ON page_snapshots(page_id, created_at DESC);
CREATE INDEX IF NOT EXISTS page_snapshots_tenant_id_idx ON page_snapshots(tenant_id);

ALTER TABLE page_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "page_snapshots_select" ON page_snapshots;
CREATE POLICY "page_snapshots_select" ON page_snapshots
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid())
  );

-- Trigger: snapshot the OLD blocks state before an UPDATE actually changes
-- them. Dedup window of 10 minutes per page — autosave fires every 2.5s
-- while typing, so without this a single editing session would create
-- hundreds of near-identical rows. A manual save right after an autosave
-- still just extends the current 10-minute window rather than snapshotting
-- again, which is the right behavior for "undo my last real editing
-- session", not "undo my last keystroke".
CREATE OR REPLACE FUNCTION snapshot_page_before_blocks_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  last_snapshot_at timestamptz;
BEGIN
  IF NEW.blocks IS DISTINCT FROM OLD.blocks THEN
    SELECT created_at INTO last_snapshot_at
    FROM page_snapshots
    WHERE page_id = OLD.id
    ORDER BY created_at DESC
    LIMIT 1;

    IF last_snapshot_at IS NULL OR last_snapshot_at < now() - interval '10 minutes' THEN
      INSERT INTO page_snapshots (tenant_id, page_id, blocks, title, reason, created_by)
      VALUES (OLD.tenant_id, OLD.id, OLD.blocks, OLD.title, 'edit', auth.uid());
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_snapshot_page_before_blocks_change ON pages;
CREATE TRIGGER trg_snapshot_page_before_blocks_change
  BEFORE UPDATE ON pages
  FOR EACH ROW
  EXECUTE FUNCTION snapshot_page_before_blocks_change();

-- Retention: keep at most the 20 most recent snapshots per page. Called
-- opportunistically by the trigger itself — cheap since it only runs when
-- a new snapshot was just inserted, not on every page save.
CREATE OR REPLACE FUNCTION prune_old_page_snapshots()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM page_snapshots
  WHERE page_id = NEW.page_id
    AND id NOT IN (
      SELECT id FROM page_snapshots
      WHERE page_id = NEW.page_id
      ORDER BY created_at DESC
      LIMIT 20
    );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prune_old_page_snapshots ON page_snapshots;
CREATE TRIGGER trg_prune_old_page_snapshots
  AFTER INSERT ON page_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION prune_old_page_snapshots();
