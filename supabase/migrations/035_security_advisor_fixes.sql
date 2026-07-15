-- 035_security_advisor_fixes.sql
-- Fixes for Supabase Security Advisor findings (advisor email 2026-07-12):
--   ERROR rls_disabled_in_public: receipt_counters
--   WARN  function_search_path_mutable: 7 functions
--   WARN  rls_policy_always_true: 4 anonymous-insert policies (server routes
--         now insert with the service role, so the open policies can go)
--   WARN  anon/authenticated_security_definer_function_executable: revoke
--         privileged helpers (RLS helpers is_super_admin/is_tenant_member/
--         is_tenant_editor intentionally stay executable — policies evaluate
--         them as the querying role)
--   INFO  rls_enabled_no_policy: page_categories, page_tags
--   WARN  public_bucket_allows_listing: media bucket listing → authenticated

begin;

-- ── receipt_counters: RLS on; super-admin read, service role for writes ─────
alter table public.receipt_counters enable row level security;
drop policy if exists "receipt_counters_sa_read" on public.receipt_counters;
create policy "receipt_counters_sa_read" on public.receipt_counters
  for select using (public.is_super_admin());

-- ── Pin search_path on flagged functions ─────────────────────────────────────
alter function public.handle_new_user() set search_path = public;
alter function public.set_updated_at() set search_path = public;
alter function public.set_tenant_context(uuid) set search_path = public;
alter function public.current_tenant_id() set search_path = public;
alter function public.apply_migration_009() set search_path = public;
alter function public.apply_migration_010() set search_path = public;
alter function public.apply_migration_011() set search_path = public;

-- ── Drop always-true anonymous insert policies ───────────────────────────────
-- booking widget + checkout + form submits all write through service-role
-- server routes now; nothing legitimate inserts these tables with anon key.
drop policy if exists "public_book" on public.booking_appointments;
drop policy if exists "public_submit" on public.contact_form_submissions;
drop policy if exists "form_submissions_public_insert" on public.form_submissions;
drop policy if exists "orders_public_insert" on public.orders;

-- ── Revoke execute on privileged SECURITY DEFINER functions ──────────────────
revoke execute on function public.apply_migration_009() from anon, authenticated;
revoke execute on function public.apply_migration_010() from anon, authenticated;
revoke execute on function public.apply_migration_011() from anon, authenticated;
revoke execute on function public.handle_new_user() from anon, authenticated;
revoke execute on function public.next_receipt_number() from anon, authenticated;
revoke execute on function public.set_tenant_context(uuid) from anon, authenticated;
revoke execute on function public.touch_contact_activity() from anon, authenticated;

-- ── page_categories / page_tags: real policies ───────────────────────────────
drop policy if exists "page_categories_read" on public.page_categories;
create policy "page_categories_read" on public.page_categories
  for select using (true);
drop policy if exists "page_categories_write" on public.page_categories;
create policy "page_categories_write" on public.page_categories
  for all using (
    exists (
      select 1 from public.pages p
      where p.id = page_id
        and (public.is_super_admin() or public.is_tenant_editor(p.tenant_id))
    )
  ) with check (
    exists (
      select 1 from public.pages p
      where p.id = page_id
        and (public.is_super_admin() or public.is_tenant_editor(p.tenant_id))
    )
  );

drop policy if exists "page_tags_read" on public.page_tags;
create policy "page_tags_read" on public.page_tags
  for select using (true);
drop policy if exists "page_tags_write" on public.page_tags;
create policy "page_tags_write" on public.page_tags
  for all using (
    exists (
      select 1 from public.pages p
      where p.id = page_id
        and (public.is_super_admin() or public.is_tenant_editor(p.tenant_id))
    )
  ) with check (
    exists (
      select 1 from public.pages p
      where p.id = page_id
        and (public.is_super_admin() or public.is_tenant_editor(p.tenant_id))
    )
  );

-- ── media bucket: stop anonymous listing (public URLs keep working — the
--    public-bucket flag serves objects directly; SELECT only gates the list API)
drop policy if exists "Public can read media" on storage.objects;
create policy "Authenticated can read media" on storage.objects
  for select to authenticated using (bucket_id = 'media');

commit;
