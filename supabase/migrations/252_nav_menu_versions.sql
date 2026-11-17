-- 252: menu history (menus P1, 2026-11-17).
-- NOT applied yet. Additive only: one new table, nothing existing changes.
-- Rollback: rollback_252_nav_menu_versions.sql.
--
-- Decision 2026-11-17: menu edits go live on save, WITH undo history. Every
-- save of a menu (Navigation screen, MCP, restore) keeps a version here; the
-- Navigation screen lists them per menu (who, when) with "Restore" and
-- "Undo last save". The app keeps the newest 50 per menu
-- (lib/navigation/menu-versions.ts trims after each save).
--
-- Written only with the service role (the app's admin client), after the
-- app's own edit-access check, so there is no insert/update/delete policy.
-- Team members (any role) can read their site's history.
--
-- Until this is applied the app keeps working: saves still save, and the
-- history panel says history is not switched on yet.

create table if not exists public.nav_menu_versions (
  id uuid primary key default gen_random_uuid(),
  menu_id uuid not null references public.nav_menus(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null default '',
  items jsonb not null default '[]'::jsonb,
  -- Who saved this version (null: saved by the system or before history existed).
  saved_by uuid references auth.users(id) on delete set null,
  -- dashboard | mcp | restore | undo | import | before (the menu as it was
  -- before its first recorded save, or after a change made outside the app).
  source text not null default 'dashboard'
    check (source in ('dashboard', 'mcp', 'restore', 'undo', 'import', 'before', 'app')),
  created_at timestamptz not null default now()
);

create index if not exists nav_menu_versions_menu_created_idx
  on public.nav_menu_versions (menu_id, created_at desc);
create index if not exists nav_menu_versions_tenant_idx
  on public.nav_menu_versions (tenant_id);

alter table public.nav_menu_versions enable row level security;

drop policy if exists nav_menu_versions_member_read on public.nav_menu_versions;
create policy nav_menu_versions_member_read on public.nav_menu_versions for select
  using (public.is_super_admin() OR public.is_tenant_member(tenant_id));

-- No anon access at all; authenticated users only through the policy above.
revoke all on public.nav_menu_versions from anon;
grant select on public.nav_menu_versions to authenticated;
grant all on public.nav_menu_versions to service_role;