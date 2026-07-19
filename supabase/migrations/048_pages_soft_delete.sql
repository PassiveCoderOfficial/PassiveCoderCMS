-- Soft delete for pages/posts: WordPress-style Trash instead of hard delete.
-- "Trash" is deleted_at IS NOT NULL — status enum untouched, so every existing
-- branch on `status` (renderer, editor header, etc.) keeps working unchanged.
alter table pages add column if not exists deleted_at timestamptz;
create index if not exists idx_pages_deleted_at on pages(deleted_at) where deleted_at is not null;
