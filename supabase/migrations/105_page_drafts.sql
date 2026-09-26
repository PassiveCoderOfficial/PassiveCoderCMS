-- Draft/publish for live pages + conflict detection.
--
-- Before this, the page editor autosaved every 2.5s straight into
-- pages.blocks — the exact column the public site renders — so on a
-- published page every half-finished edit went live to real visitors
-- immediately, and two people editing the same page silently overwrote
-- each other (last write wins, no warning). Found in the 2026-09-26
-- production audit.
--
-- Model:
--   * Only LIVE pages (status = 'published', not a template page) get a
--     draft. Draft/scheduled pages aren't public, so they keep saving
--     straight into `blocks` exactly as before — the status dropdown and
--     the publish-scheduled cron need no changes.
--   * Template pages (template_id set) never draft: template apply copies
--     `blocks`, so a pending draft there would ship stale content.
--   * draft_rev increments on ANY change to blocks or draft_blocks, from
--     any writer (editor, restore, AI, mobile app, template apply...), via
--     the trigger below — so an open editor always learns the page changed
--     underneath it, even from code that knows nothing about drafts.
--   * A direct write to `blocks` that doesn't also touch `draft_blocks`
--     supersedes any pending draft (clears it) — a stale draft can never
--     later be published over newer live content.

alter table pages
  add column if not exists draft_blocks jsonb,
  add column if not exists draft_rev integer not null default 0;

create or replace function pages_bump_draft_rev()
returns trigger
language plpgsql
as $$
begin
  if new.blocks is distinct from old.blocks
     or new.draft_blocks is distinct from old.draft_blocks then
    if new.blocks is distinct from old.blocks
       and new.draft_blocks is not distinct from old.draft_blocks then
      new.draft_blocks := null;
    end if;
    new.draft_rev := old.draft_rev + 1;
  end if;
  return new;
end $$;

drop trigger if exists trg_pages_draft_rev on pages;
create trigger trg_pages_draft_rev
  before update on pages
  for each row execute function pages_bump_draft_rev();

-- Save from the editor. Decides draft-vs-direct from the row's CURRENT
-- status (not the editor's possibly-stale idea of it), atomically.
-- p_expected_rev null = force overwrite (used by "keep mine" after a
-- conflict). SECURITY INVOKER: RLS still decides who may write the page.
create or replace function save_page_blocks(p_id uuid, p_blocks jsonb, p_expected_rev integer default null)
returns table(rev integer, has_draft boolean)
language plpgsql
security invoker
set search_path = public
as $$
#variable_conflict use_column
declare
  v_status text;
  v_template uuid;
  v_rev integer;
  v_live jsonb;
  v_rows integer;
begin
  select p.status, p.template_id, p.draft_rev, p.blocks
    into v_status, v_template, v_rev, v_live
    from pages p where p.id = p_id for update;
  if not found then
    raise exception 'page_not_found';
  end if;
  if p_expected_rev is not null and v_rev <> p_expected_rev then
    raise exception 'page_conflict';
  end if;

  if v_status = 'published' and v_template is null then
    -- Editing back to exactly the live content (e.g. undo) is "no draft",
    -- not a draft identical to live.
    update pages
       set draft_blocks = case when p_blocks = v_live then null else p_blocks end
     where id = p_id;
  else
    update pages set blocks = p_blocks, draft_blocks = null where id = p_id;
  end if;
  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    raise exception 'page_not_writable';
  end if;

  return query select p.draft_rev, p.draft_blocks is not null from pages p where p.id = p_id;
end $$;

-- Make the editor's current content live. Always records the outgoing live
-- version as a snapshot (the edit-trigger's 10-minute dedup would otherwise
-- skip it when publishing twice in quick succession), so every publish is
-- one click away from rollback in page history.
create or replace function publish_page(p_id uuid, p_blocks jsonb, p_expected_rev integer default null)
returns table(rev integer, has_draft boolean)
language plpgsql
security invoker
set search_path = public
as $$
#variable_conflict use_column
declare
  v_rev integer;
  v_rows integer;
begin
  select p.draft_rev into v_rev
    from pages p where p.id = p_id for update;
  if not found then
    raise exception 'page_not_found';
  end if;
  if p_expected_rev is not null and v_rev <> p_expected_rev then
    raise exception 'page_conflict';
  end if;

  -- Tell the (SECURITY DEFINER) snapshot trigger to capture the outgoing
  -- live version even inside its 10-minute dedup window. Transaction-local,
  -- and it only affects rows this caller could update anyway (RLS gates the
  -- UPDATE below), so there's nothing to abuse.
  perform set_config('app.force_page_snapshot', 'on', true);

  update pages
     set blocks = p_blocks,
         draft_blocks = null,
         status = 'published',
         published_at = coalesce(published_at, now())
   where id = p_id;
  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    raise exception 'page_not_writable';
  end if;

  return query select p.draft_rev, false from pages p where p.id = p_id;
end $$;

-- Throw away unpublished changes; returns the live content to reload.
create or replace function discard_page_draft(p_id uuid)
returns table(rev integer, blocks jsonb)
language plpgsql
security invoker
set search_path = public
as $$
#variable_conflict use_column
declare
  v_rows integer;
begin
  update pages set draft_blocks = null where id = p_id;
  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    raise exception 'page_not_writable';
  end if;
  return query select p.draft_rev, p.blocks from pages p where p.id = p_id;
end $$;

-- Snapshot trigger: honor the publish flag above.
create or replace function snapshot_page_before_blocks_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  last_snapshot_at timestamptz;
begin
  if new.blocks is distinct from old.blocks then
    select created_at into last_snapshot_at
    from page_snapshots
    where page_id = old.id
    order by created_at desc
    limit 1;

    if last_snapshot_at is null
       or last_snapshot_at < now() - interval '10 minutes'
       or current_setting('app.force_page_snapshot', true) = 'on' then
      insert into page_snapshots (tenant_id, page_id, blocks, title, reason, created_by)
      values (old.tenant_id, old.id, old.blocks, old.title, 'edit', auth.uid());
    end if;
  end if;
  return new;
end $$;

-- Postgres grants EXECUTE to PUBLIC by default; these are for signed-in
-- editors only (RLS then decides which pages). See migration 102 for why
-- this matters.
revoke execute on function save_page_blocks(uuid, jsonb, integer) from public, anon;
revoke execute on function publish_page(uuid, jsonb, integer) from public, anon;
revoke execute on function discard_page_draft(uuid) from public, anon;
grant execute on function save_page_blocks(uuid, jsonb, integer) to authenticated, service_role;
grant execute on function publish_page(uuid, jsonb, integer) to authenticated, service_role;
grant execute on function discard_page_draft(uuid) to authenticated, service_role;
