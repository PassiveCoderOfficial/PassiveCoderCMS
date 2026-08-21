-- page_snapshots.tenant_id was NOT NULL, but pages.tenant_id itself is
-- nullable by design — a template page (tenant_id IS NULL, template_id set)
-- is the documented alternative to a tenant page, not an edge case. The
-- snapshot trigger (trg_snapshot_page_before_blocks_change) inserts
-- OLD.tenant_id on every blocks edit, so any edit whatsoever to a template
-- page's blocks — through the template editor, or a direct update — failed
-- with "null value in column tenant_id violates not-null constraint".
--
-- This blocked editing every one of the 22 templates on the platform via
-- their own visual editor, the core workflow the DB-backed template engine
-- exists for.

ALTER TABLE public.page_snapshots ALTER COLUMN tenant_id DROP NOT NULL;
