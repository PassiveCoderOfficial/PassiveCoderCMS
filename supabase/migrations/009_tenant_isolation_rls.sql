-- 009_tenant_isolation_rls.sql
-- Enforce per-tenant isolation via RLS on the 10 tenant tables that previously
-- had role-only / unscoped policies. Any authenticated admin/editor could read
-- and write EVERY tenant's rows through the browser anon key. We replace those
-- with membership-scoped policies (super-admin bypass) while preserving the
-- public read / public insert paths the marketing sites and storefront need.
--
-- The other 27 tenant tables (services, features, portfolio, etc.) were already
-- scoped with `tenant_id IN (SELECT ... FROM tenant_members ...)` and are left
-- untouched.

begin;

-- ── Helper functions (SECURITY DEFINER avoids RLS recursion) ────────────────
create or replace function public.is_super_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from public.super_admins where user_id = auth.uid());
$$;

create or replace function public.is_tenant_member(t uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.tenant_members
    where tenant_id = t and user_id = auth.uid()
  );
$$;

-- ── pages ───────────────────────────────────────────────────────────────────
drop policy if exists "Editors manage pages" on public.pages;
drop policy if exists "Published pages public" on public.pages;
create policy "pages_public_read" on public.pages
  for select using (status = 'published');
create policy "pages_tenant_all" on public.pages
  for all
  using (public.is_super_admin() or public.is_tenant_member(tenant_id))
  with check (public.is_super_admin() or public.is_tenant_member(tenant_id));

-- ── products ──────────────────────────────────────────────────────────────
drop policy if exists "Active products public" on public.products;
drop policy if exists "Admins manage products" on public.products;
create policy "products_public_read" on public.products
  for select using (status = 'active');
create policy "products_tenant_all" on public.products
  for all
  using (public.is_super_admin() or public.is_tenant_member(tenant_id))
  with check (public.is_super_admin() or public.is_tenant_member(tenant_id));

-- ── orders (storefront checkout inserts anonymously) ────────────────────────
drop policy if exists "Admins manage orders" on public.orders;
drop policy if exists "Customers see own orders" on public.orders;
drop policy if exists "Public can create orders" on public.orders;
create policy "orders_public_insert" on public.orders
  for insert with check (true);
create policy "orders_tenant_manage" on public.orders
  for select using (public.is_super_admin() or public.is_tenant_member(tenant_id));
create policy "orders_tenant_update" on public.orders
  for update using (public.is_super_admin() or public.is_tenant_member(tenant_id))
  with check (public.is_super_admin() or public.is_tenant_member(tenant_id));
create policy "orders_tenant_delete" on public.orders
  for delete using (public.is_super_admin() or public.is_tenant_member(tenant_id));

-- ── media ───────────────────────────────────────────────────────────────────
drop policy if exists "Editors can manage media" on public.media;
drop policy if exists "Media readable by authenticated users" on public.media;
drop policy if exists "Users can manage own media" on public.media;
create policy "media_tenant_all" on public.media
  for all
  using (public.is_super_admin() or public.is_tenant_member(tenant_id))
  with check (public.is_super_admin() or public.is_tenant_member(tenant_id));

-- ── plugins ───────────────────────────────────────────────────────────────
drop policy if exists "Admins manage plugins" on public.plugins;
drop policy if exists "Plugins readable by authenticated" on public.plugins;
create policy "plugins_tenant_all" on public.plugins
  for all
  using (public.is_super_admin() or public.is_tenant_member(tenant_id))
  with check (public.is_super_admin() or public.is_tenant_member(tenant_id));

-- ── themes (public render reads theme config) ───────────────────────────────
drop policy if exists "Admins manage themes" on public.themes;
drop policy if exists "Themes public read" on public.themes;
create policy "themes_public_read" on public.themes
  for select using (true);
create policy "themes_tenant_all" on public.themes
  for all
  using (public.is_super_admin() or public.is_tenant_member(tenant_id))
  with check (public.is_super_admin() or public.is_tenant_member(tenant_id));

-- ── site_settings (public render reads site config) ─────────────────────────
drop policy if exists "Only admins can modify settings" on public.site_settings;
drop policy if exists "Settings readable by all" on public.site_settings;
create policy "site_settings_public_read" on public.site_settings
  for select using (true);
create policy "site_settings_tenant_all" on public.site_settings
  for all
  using (public.is_super_admin() or public.is_tenant_member(tenant_id))
  with check (public.is_super_admin() or public.is_tenant_member(tenant_id));

-- ── forms (public render reads form config) ─────────────────────────────────
drop policy if exists "Forms public read" on public.forms;
create policy "forms_public_read" on public.forms
  for select using (true);
create policy "forms_tenant_all" on public.forms
  for all
  using (public.is_super_admin() or public.is_tenant_member(tenant_id))
  with check (public.is_super_admin() or public.is_tenant_member(tenant_id));

-- ── form_submissions (public submit, admin read) ───────────────────────────
drop policy if exists "Admins read submissions" on public.form_submissions;
drop policy if exists "Public submit forms" on public.form_submissions;
create policy "form_submissions_public_insert" on public.form_submissions
  for insert with check (true);
create policy "form_submissions_tenant_read" on public.form_submissions
  for select using (public.is_super_admin() or public.is_tenant_member(tenant_id));
create policy "form_submissions_tenant_modify" on public.form_submissions
  for update using (public.is_super_admin() or public.is_tenant_member(tenant_id))
  with check (public.is_super_admin() or public.is_tenant_member(tenant_id));
create policy "form_submissions_tenant_delete" on public.form_submissions
  for delete using (public.is_super_admin() or public.is_tenant_member(tenant_id));

-- ── tenant_members (self read; writes stay service-role only) ───────────────
drop policy if exists "tenant_members_select" on public.tenant_members;
create policy "tenant_members_self_read" on public.tenant_members
  for select using (user_id = auth.uid() or public.is_super_admin());

commit;
