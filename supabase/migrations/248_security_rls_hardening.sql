-- 248: close RLS holes found in the 2026-11-16 security review.
-- All app code paths for these tables use the service role, except where noted.

-- 1. platform_settings: gateway keys were readable with the anon key.
--    Table-level rights go; only non-secret columns stay readable.
revoke all on public.platform_settings from anon, authenticated;
grant select (
  id, default_commission_rate, default_commission_type, staff_signup_enabled, staff_auto_approve,
  updated_at, bkash_number, nagad_number, bank_details, manual_payment_instructions,
  default_staff_recurring_pct, usd_to_bdt_rate, shurjopay_mode, dodo_mode, whatsapp_number,
  staff_commission_enabled, experts_verified_yearly_usd_cents, experts_founding_spots,
  manager_discount_limit_pct, panel_timezone
) on public.platform_settings to anon, authenticated;

-- 2. profiles: a signed-in user could set their own role / is_active / email.
--    Direct (PostgREST) updates keep those columns as they were.
create or replace function public.profiles_guard_self_update() returns trigger
language plpgsql set search_path = public as $$
begin
  if current_user in ('authenticated', 'anon') then
    new.id := old.id;
    new.role := old.role;
    new.is_active := old.is_active;
    new.email := old.email;
    new.email_verified_at := old.email_verified_at;
    new.whatsapp_verified_at := old.whatsapp_verified_at;
    new.created_at := old.created_at;
  end if;
  return new;
end $$;
drop trigger if exists trg_profiles_guard_self_update on public.profiles;
create trigger trg_profiles_guard_self_update before update on public.profiles
  for each row execute function public.profiles_guard_self_update();

-- 3. Legacy "profiles.role = admin" policies on tables with no tenant scope:
--    only super admins keep direct write access.
drop policy if exists "Admins manage gateways" on public.payment_gateways;
drop policy if exists "Admins manage ecommerce settings" on public.ecommerce_settings;
drop policy if exists "Admins manage tags" on public.tags;
drop policy if exists "Admins manage menus" on public.menus;
drop policy if exists "Admins manage delivery" on public.delivery_options;
drop policy if exists "Admins manage variants" on public.product_variants;
create policy "Super admins manage gateways" on public.payment_gateways for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy "Super admins manage ecommerce settings" on public.ecommerce_settings for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy "Super admins manage tags" on public.tags for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy "Super admins manage menus" on public.menus for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy "Super admins manage delivery" on public.delivery_options for all using (public.is_super_admin()) with check (public.is_super_admin());
drop policy if exists "Active gateways public" on public.payment_gateways;
create policy "Active gateways public" on public.payment_gateways for select using (is_enabled = true or public.is_super_admin());
drop policy if exists "Active delivery public" on public.delivery_options;
create policy "Active delivery public" on public.delivery_options for select using (is_enabled = true or public.is_super_admin());

-- 4. pc_staff / agents: a staff member could set their own status, manager
--    flag and commission. Direct self-updates keep only the profile fields.
create or replace function public.staff_guard_self_update() returns trigger
language plpgsql set search_path = public as $$
declare keep jsonb; o jsonb := to_jsonb(old); n jsonb := to_jsonb(new);
begin
  if current_user in ('authenticated', 'anon') and not public.is_super_admin() then
    keep := jsonb_build_object('full_name', n->'full_name', 'company', n->'company', 'website', n->'website', 'bio', n->'bio', 'updated_at', n->'updated_at');
    new := jsonb_populate_record(old, o || keep);
  end if;
  return new;
end $$;
drop trigger if exists trg_pc_staff_guard_self_update on public.pc_staff;
create trigger trg_pc_staff_guard_self_update before update on public.pc_staff
  for each row execute function public.staff_guard_self_update();
drop trigger if exists trg_agents_guard_self_update on public.agents;
create trigger trg_agents_guard_self_update before update on public.agents
  for each row execute function public.staff_guard_self_update();

-- 5. templates: any user could publish a row into the shared catalogue.
drop policy if exists templates_owner_write on public.templates;
create policy templates_super_admin_write on public.templates for all using (public.is_super_admin()) with check (public.is_super_admin());

-- 6. media bucket: any signed-in user could delete or list every site's files.
--    Uploads from the browser are only the ticket attachments; everything
--    else goes through the API (service role).
drop policy if exists "Authenticated users can delete media" on storage.objects;
drop policy if exists "Authenticated can read media" on storage.objects;
drop policy if exists "Authenticated users can upload media" on storage.objects;
create policy "Own media objects readable" on storage.objects for select to authenticated
  using (bucket_id = 'media' and owner = auth.uid());
create policy "Ticket attachments upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = 'ticket-attachments');