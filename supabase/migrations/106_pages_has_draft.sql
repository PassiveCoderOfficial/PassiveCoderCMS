-- Cheap flag for list screens: does this page have unpublished edits?
-- Lets the dashboard pages list badge "Unpublished changes" without
-- pulling every page's full draft_blocks JSON. A client who edits a live
-- page and closes the tab otherwise has no sign, outside the editor, that
-- their changes aren't on the site yet (see migration 105).
alter table pages
  add column if not exists has_draft boolean generated always as (draft_blocks is not null) stored;
