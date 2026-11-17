-- 250: follow-ups from the 2026-11-16 security review.
-- NOT applied yet. Before applying on production, compare the policy names
-- below with pg_policies (they are taken from selfhost/schema.sql): a
-- "drop policy if exists" on a name that differs leaves the old policy in place.

-- 1. tenant_members.created_by_site: true only when the site's own invite
--    created the account (api/users/invite). A site's admins may set the
--    password of those accounts only (api/users/password); an existing account
--    that was merely added to a team by email is never resettable by that site.
--    Every existing row stays false: until now nothing recorded who made an
--    account, so none is assumed to be the site's own. Staff and super admins
--    are not affected by this column.
alter table public.tenant_members add column if not exists created_by_site boolean not null default false;
comment on column public.tenant_members.created_by_site is
  'True when this site''s invite created the account. Only then may the site''s own admins set its password.';

-- 2. View-only team members could write these tables directly (PostgREST with
--    their own session). Writes now need owner, admin or editor.
--    is_tenant_editor() also covers the assigned agent and active Passive Coder
--    staff (staff_can_edit_site, migration 214), exactly as is_tenant_member()
--    does, so staff access is unchanged. Reads keep their own policies
--    (site_settings_public_read, tenant_read, orders_tenant_manage).
drop policy if exists site_settings_tenant_all on public.site_settings;
create policy site_settings_tenant_all on public.site_settings for all
  using (public.is_super_admin() or public.is_tenant_editor(tenant_id))
  with check (public.is_super_admin() or public.is_tenant_editor(tenant_id));

drop policy if exists tenant_write on public.site_identity;
create policy tenant_write on public.site_identity for all
  using (public.is_super_admin() or public.is_tenant_editor(tenant_id))
  with check (public.is_super_admin() or public.is_tenant_editor(tenant_id));

drop policy if exists tenant_write on public.booking_appointments;
create policy tenant_write on public.booking_appointments for all
  using (public.is_super_admin() or public.is_tenant_editor(tenant_id))
  with check (public.is_super_admin() or public.is_tenant_editor(tenant_id));

drop policy if exists orders_tenant_update on public.orders;
create policy orders_tenant_update on public.orders for update
  using (public.is_super_admin() or public.is_tenant_editor(tenant_id))
  with check (public.is_super_admin() or public.is_tenant_editor(tenant_id));

drop policy if exists orders_tenant_delete on public.orders;
create policy orders_tenant_delete on public.orders for delete
  using (public.is_super_admin() or public.is_tenant_editor(tenant_id));

-- 3. experts: the owner's own UPDATE policy (experts_owner_write) let them set
--    their own Verified badge, paid-until date, rating and listing. The app
--    writes experts only with the service role (api/experts/*, lib/experts/*),
--    so a direct update keeps every column that is decided by Passive Coder or
--    by the API's own checks. Columns missing from the table are ignored.
create or replace function public.experts_guard_owner_update() returns trigger
language plpgsql set search_path = public as $$
declare
  locked text[] := array[
    'id', 'tenant_id', 'owner_user_id', 'slug', 'created_at', 'source', 'source_ref', 'email',
    'listed',
    'verification_status', 'verification_requested_at', 'verified_at', 'verified_by', 'verification_notes',
    'verified_paid_until', 'docs', 'founding_since',
    'rating_avg', 'rating_count'
  ];
  keep jsonb;
begin
  if current_user in ('authenticated', 'anon') and not public.is_super_admin() then
    select coalesce(jsonb_object_agg(e.key, e.value), '{}'::jsonb) into keep
      from jsonb_each(to_jsonb(old)) e where e.key = any(locked);
    new := jsonb_populate_record(new, keep);
  end if;
  return new;
end $$;
drop trigger if exists trg_experts_guard_owner_update on public.experts;
create trigger trg_experts_guard_owner_update before update on public.experts
  for each row execute function public.experts_guard_owner_update();

-- 4. profiles: every signed-in user could read every account's email and role
--    ("Profiles readable by all", using true). Signed-in users now see their
--    own row, people on a site they are also on, and everything if they are a
--    super admin or active Passive Coder staff. Visitors (anon) keep the public
--    columns granted in migration 249.
--    Checked 2026-11-16: the only reads of profiles made with a user's own
--    session are of the user's own row (app/(auth)/login/login-form.tsx and
--    app/(admin)/dashboard/profile/page.tsx); every other read uses the
--    service role, which bypasses RLS.
create or replace function public.profile_visible_to_me(p uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.tenant_members mine
    join public.tenant_members theirs on theirs.tenant_id = mine.tenant_id
    where mine.user_id = auth.uid() and theirs.user_id = p
  )
  or exists (select 1 from public.pc_staff s where s.user_id = auth.uid() and s.status = 'active');
$$;
revoke all on function public.profile_visible_to_me(uuid) from public;
grant execute on function public.profile_visible_to_me(uuid) to authenticated, service_role;

drop policy if exists "Profiles readable by all" on public.profiles;
create policy "Profiles public columns for visitors" on public.profiles for select to anon using (true);
create policy "Profiles own, team and staff" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_super_admin() or public.profile_visible_to_me(id));