

drop policy if exists tenant_write on public.booking_availability;
create policy tenant_write on public.booking_availability for all
  using (public.is_super_admin() OR public.is_tenant_editor(tenant_id));

drop policy if exists tenant_write on public.booking_blocked_dates;
create policy tenant_write on public.booking_blocked_dates for all
  using (public.is_super_admin() OR public.is_tenant_editor(tenant_id));

drop policy if exists tenant_write on public.booking_settings;
create policy tenant_write on public.booking_settings for all
  using (public.is_super_admin() OR public.is_tenant_editor(tenant_id));

drop policy if exists branch_availability_tenant_manage on public.branch_product_availability;
create policy branch_availability_tenant_manage on public.branch_product_availability for all
  using (EXISTS ( SELECT 1 FROM public.restaurant_branches b WHERE ((b.id = branch_product_availability.branch_id) AND public.is_tenant_editor(b.tenant_id))))
  with check (EXISTS ( SELECT 1 FROM public.restaurant_branches b WHERE ((b.id = branch_product_availability.branch_id) AND public.is_tenant_editor(b.tenant_id))));

drop policy if exists categories_tenant_all on public.categories;
create policy categories_tenant_all on public.categories for all
  using (public.is_super_admin() OR public.is_tenant_editor(tenant_id))
  with check (public.is_super_admin() OR public.is_tenant_editor(tenant_id));

drop policy if exists tenant_write on public.contact_details;
create policy tenant_write on public.contact_details for all
  using (public.is_super_admin() OR public.is_tenant_editor(tenant_id));

drop policy if exists tenant_write on public.contact_form_submissions;
create policy tenant_write on public.contact_form_submissions for all
  using (public.is_super_admin() OR public.is_tenant_editor(tenant_id));

drop policy if exists tenant_write on public.contact_forms;
create policy tenant_write on public.contact_forms for all
  using (public.is_super_admin() OR public.is_tenant_editor(tenant_id));

drop policy if exists content_module_grants_write on public.content_module_grants;
create policy content_module_grants_write on public.content_module_grants for all
  using (public.is_super_admin() OR (EXISTS ( SELECT 1 FROM public.tenant_members WHERE ((tenant_members.tenant_id = content_module_grants.tenant_id) AND (tenant_members.user_id = auth.uid()) AND (tenant_members.role = ANY (ARRAY['owner'::text, 'admin'::text]))))) OR (EXISTS ( SELECT 1 FROM public.content_module_grants g WHERE ((g.tenant_id = content_module_grants.tenant_id) AND (g.user_id = auth.uid()) AND (g.access_level = 'admin'::text)))) OR public.is_tenant_editor(tenant_id))
  with check (public.is_super_admin() OR (EXISTS ( SELECT 1 FROM public.tenant_members WHERE ((tenant_members.tenant_id = content_module_grants.tenant_id) AND (tenant_members.user_id = auth.uid()) AND (tenant_members.role = ANY (ARRAY['owner'::text, 'admin'::text]))))) OR (EXISTS ( SELECT 1 FROM public.content_module_grants g WHERE ((g.tenant_id = content_module_grants.tenant_id) AND (g.user_id = auth.uid()) AND (g.access_level = 'admin'::text)))) OR public.is_tenant_editor(tenant_id));
drop policy if exists content_module_grants_member_read on public.content_module_grants;
create policy content_module_grants_member_read on public.content_module_grants for select
  using (public.is_super_admin() OR (EXISTS ( SELECT 1 FROM public.tenant_members WHERE ((tenant_members.tenant_id = content_module_grants.tenant_id) AND (tenant_members.user_id = auth.uid()) AND (tenant_members.role = ANY (ARRAY['owner'::text, 'admin'::text]))))) OR (EXISTS ( SELECT 1 FROM public.content_module_grants g WHERE ((g.tenant_id = content_module_grants.tenant_id) AND (g.user_id = auth.uid()) AND (g.access_level = 'admin'::text)))) OR public.is_tenant_member(tenant_id));

drop policy if exists tenant_write on public.feature_groups;
create policy tenant_write on public.feature_groups for all
  using (public.is_super_admin() OR public.is_tenant_editor(tenant_id));

drop policy if exists tenant_write on public.feature_items;
create policy tenant_write on public.feature_items for all
  using (public.is_super_admin() OR public.is_tenant_editor(tenant_id));

drop policy if exists form_submissions_tenant_delete on public.form_submissions;
create policy form_submissions_tenant_delete on public.form_submissions for delete
  using (public.is_super_admin() OR public.is_tenant_editor(tenant_id));

drop policy if exists form_submissions_tenant_modify on public.form_submissions;
create policy form_submissions_tenant_modify on public.form_submissions for update
  using (public.is_super_admin() OR public.is_tenant_editor(tenant_id))
  with check (public.is_super_admin() OR public.is_tenant_editor(tenant_id));

drop policy if exists forms_tenant_all on public.forms;
create policy forms_tenant_all on public.forms for all
  using (public.is_super_admin() OR public.is_tenant_editor(tenant_id))
  with check (public.is_super_admin() OR public.is_tenant_editor(tenant_id));

drop policy if exists media_tenant_all on public.media;
create policy media_tenant_all on public.media for all
  using (public.is_super_admin() OR public.is_tenant_editor(tenant_id))
  with check (public.is_super_admin() OR public.is_tenant_editor(tenant_id));
drop policy if exists media_member_read on public.media;
create policy media_member_read on public.media for select
  using (public.is_super_admin() OR public.is_tenant_member(tenant_id));

drop policy if exists nav_menus_write on public.nav_menus;
create policy nav_menus_write on public.nav_menus for all
  using (public.is_super_admin() OR ((tenant_id IS NOT NULL) AND public.is_tenant_editor(tenant_id)) OR ((template_id IS NOT NULL) AND (template_id IN ( SELECT templates.id FROM public.templates WHERE (templates.owner_id = auth.uid())))))
  with check (public.is_super_admin() OR ((tenant_id IS NOT NULL) AND public.is_tenant_editor(tenant_id)) OR ((template_id IS NOT NULL) AND (template_id IN ( SELECT templates.id FROM public.templates WHERE (templates.owner_id = auth.uid())))));

drop policy if exists tenant_write on public.nav_menus;
create policy tenant_write on public.nav_menus for all
  using (public.is_super_admin() OR public.is_tenant_editor(tenant_id));

drop policy if exists page_redirects_member_delete on public.page_redirects;
create policy page_redirects_member_delete on public.page_redirects for delete
  using (public.is_tenant_editor(tenant_id));

drop policy if exists pages_tenant_all on public.pages;
create policy pages_tenant_all on public.pages for all
  using (public.is_super_admin() OR ((tenant_id IS NOT NULL) AND public.is_tenant_editor(tenant_id)) OR ((template_id IS NOT NULL) AND (template_id IN ( SELECT templates.id FROM public.templates WHERE (templates.owner_id = auth.uid())))))
  with check (public.is_super_admin() OR ((tenant_id IS NOT NULL) AND public.is_tenant_editor(tenant_id)) OR ((template_id IS NOT NULL) AND (template_id IN ( SELECT templates.id FROM public.templates WHERE (templates.owner_id = auth.uid())))));
drop policy if exists pages_member_read on public.pages;
create policy pages_member_read on public.pages for select
  using (public.is_super_admin() OR ((tenant_id IS NOT NULL) AND public.is_tenant_member(tenant_id)) OR ((template_id IS NOT NULL) AND (template_id IN ( SELECT templates.id FROM public.templates WHERE (templates.owner_id = auth.uid())))));

drop policy if exists plugins_tenant_all on public.plugins;
create policy plugins_tenant_all on public.plugins for all
  using (public.is_super_admin() OR public.is_tenant_editor(tenant_id))
  with check (public.is_super_admin() OR public.is_tenant_editor(tenant_id));
drop policy if exists plugins_member_read on public.plugins;
create policy plugins_member_read on public.plugins for select
  using (public.is_super_admin() OR public.is_tenant_member(tenant_id));

drop policy if exists tenant_write on public.portfolio_groups;
create policy tenant_write on public.portfolio_groups for all
  using (public.is_super_admin() OR public.is_tenant_editor(tenant_id));

drop policy if exists tenant_write on public.portfolio_items;
create policy tenant_write on public.portfolio_items for all
  using (public.is_super_admin() OR public.is_tenant_editor(tenant_id));

drop policy if exists tenant_write on public.pricing_packages;
create policy tenant_write on public.pricing_packages for all
  using (public.is_super_admin() OR public.is_tenant_editor(tenant_id));

drop policy if exists tenant_write on public.pricing_tables;
create policy tenant_write on public.pricing_tables for all
  using (public.is_super_admin() OR public.is_tenant_editor(tenant_id));

drop policy if exists products_tenant_all on public.products;
create policy products_tenant_all on public.products for all
  using (public.is_super_admin() OR public.is_tenant_editor(tenant_id))
  with check (public.is_super_admin() OR public.is_tenant_editor(tenant_id));
drop policy if exists products_member_read on public.products;
create policy products_member_read on public.products for select
  using (public.is_super_admin() OR public.is_tenant_member(tenant_id));

drop policy if exists restaurant_branches_tenant_manage on public.restaurant_branches;
create policy restaurant_branches_tenant_manage on public.restaurant_branches for all
  using (public.is_tenant_editor(tenant_id))
  with check (public.is_tenant_editor(tenant_id));
drop policy if exists restaurant_branches_member_read on public.restaurant_branches;
create policy restaurant_branches_member_read on public.restaurant_branches for select
  using (public.is_tenant_member(tenant_id));

drop policy if exists restaurant_reservations_tenant_manage on public.restaurant_reservations;
create policy restaurant_reservations_tenant_manage on public.restaurant_reservations for all
  using (public.is_tenant_editor(tenant_id))
  with check (public.is_tenant_editor(tenant_id));
drop policy if exists restaurant_reservations_member_read on public.restaurant_reservations;
create policy restaurant_reservations_member_read on public.restaurant_reservations for select
  using (public.is_tenant_member(tenant_id));

drop policy if exists restaurant_riders_tenant_manage on public.restaurant_riders;
create policy restaurant_riders_tenant_manage on public.restaurant_riders for all
  using (EXISTS ( SELECT 1 FROM public.restaurant_branches b WHERE ((b.id = restaurant_riders.branch_id) AND public.is_tenant_editor(b.tenant_id))))
  with check (EXISTS ( SELECT 1 FROM public.restaurant_branches b WHERE ((b.id = restaurant_riders.branch_id) AND public.is_tenant_editor(b.tenant_id))));
drop policy if exists restaurant_riders_member_read on public.restaurant_riders;
create policy restaurant_riders_member_read on public.restaurant_riders for select
  using (EXISTS ( SELECT 1 FROM public.restaurant_branches b WHERE ((b.id = restaurant_riders.branch_id) AND public.is_tenant_member(b.tenant_id))));

drop policy if exists restaurant_tables_tenant_manage on public.restaurant_tables;
create policy restaurant_tables_tenant_manage on public.restaurant_tables for all
  using (EXISTS ( SELECT 1 FROM public.restaurant_branches b WHERE ((b.id = restaurant_tables.branch_id) AND public.is_tenant_editor(b.tenant_id))))
  with check (EXISTS ( SELECT 1 FROM public.restaurant_branches b WHERE ((b.id = restaurant_tables.branch_id) AND public.is_tenant_editor(b.tenant_id))));
drop policy if exists restaurant_tables_member_read on public.restaurant_tables;
create policy restaurant_tables_member_read on public.restaurant_tables for select
  using (EXISTS ( SELECT 1 FROM public.restaurant_branches b WHERE ((b.id = restaurant_tables.branch_id) AND public.is_tenant_member(b.tenant_id))));

drop policy if exists section_preset_saves_tenant_all on public.section_preset_saves;
create policy section_preset_saves_tenant_all on public.section_preset_saves for all
  using (public.is_super_admin() OR public.is_tenant_editor(tenant_id))
  with check (public.is_super_admin() OR public.is_tenant_editor(tenant_id));
drop policy if exists section_preset_saves_member_read on public.section_preset_saves;
create policy section_preset_saves_member_read on public.section_preset_saves for select
  using (public.is_super_admin() OR public.is_tenant_member(tenant_id));

drop policy if exists tenant_write on public.service_groups;
create policy tenant_write on public.service_groups for all
  using (public.is_super_admin() OR public.is_tenant_editor(tenant_id));

drop policy if exists tenant_write on public.service_items;
create policy tenant_write on public.service_items for all
  using (public.is_super_admin() OR public.is_tenant_editor(tenant_id));

drop policy if exists shipping_rates_tenant_all on public.shipping_rates;
create policy shipping_rates_tenant_all on public.shipping_rates for all
  using (public.is_super_admin() OR public.is_tenant_editor(tenant_id))
  with check (public.is_super_admin() OR public.is_tenant_editor(tenant_id));

drop policy if exists tenant_write on public.slider_groups;
create policy tenant_write on public.slider_groups for all
  using (public.is_super_admin() OR public.is_tenant_editor(tenant_id));

drop policy if exists tenant_write on public.slider_slides;
create policy tenant_write on public.slider_slides for all
  using (public.is_super_admin() OR public.is_tenant_editor(tenant_id));

drop policy if exists sub_orders_tenant_all on public.sub_orders;
create policy sub_orders_tenant_all on public.sub_orders for all
  using (public.is_super_admin() OR public.is_tenant_editor(tenant_id))
  with check (public.is_super_admin() OR public.is_tenant_editor(tenant_id));
drop policy if exists sub_orders_member_read on public.sub_orders;
create policy sub_orders_member_read on public.sub_orders for select
  using (public.is_super_admin() OR public.is_tenant_member(tenant_id));

drop policy if exists tti_tenant_write on public.tenant_template_imports;
create policy tti_tenant_write on public.tenant_template_imports for all
  using (public.is_super_admin() OR public.is_tenant_editor(tenant_id));

drop policy if exists tenant_write on public.testimonial_groups;
create policy tenant_write on public.testimonial_groups for all
  using (public.is_super_admin() OR public.is_tenant_editor(tenant_id));

drop policy if exists tenant_write on public.testimonials;
create policy tenant_write on public.testimonials for all
  using (public.is_super_admin() OR public.is_tenant_editor(tenant_id));

drop policy if exists themes_tenant_all on public.themes;
create policy themes_tenant_all on public.themes for all
  using (public.is_super_admin() OR public.is_tenant_editor(tenant_id))
  with check (public.is_super_admin() OR public.is_tenant_editor(tenant_id));

drop policy if exists transactions_tenant_all on public.transactions;
create policy transactions_tenant_all on public.transactions for all
  using (public.is_super_admin() OR public.is_tenant_editor(tenant_id))
  with check (public.is_super_admin() OR public.is_tenant_editor(tenant_id));
drop policy if exists transactions_member_read on public.transactions;
create policy transactions_member_read on public.transactions for select
  using (public.is_super_admin() OR public.is_tenant_member(tenant_id));

-- 2. publish_due_scheduled(p_tenant, p_all) is SECURITY DEFINER and was
--    executable by anon and authenticated (and by PUBLIC, the default for a
--    new function): anyone with the public anon key could publish every
--    site's scheduled posts early, or any one site's. Only the app's own
--    cron and page-view hook call it, with the service role
--    (lib/posts/scheduled.ts).
revoke all on function public.publish_due_scheduled(uuid, boolean) from public, anon, authenticated;
grant execute on function public.publish_due_scheduled(uuid, boolean) to service_role;

-- 3. subscriptions.pending_checkout_ref: the random reference of the card
--    checkout the pending_* columns were written for (lib/billing/activate.ts,
--    newCheckoutRef). The Dodo webhook activates a pricing-v2 payment only
--    when the payment carries this same reference, so paying for an earlier,
--    cheaper checkout cannot switch on what was started after it. Nullable,
--    no default: existing rows stay null and the app treats a missing column
--    or a null value as "checkout opened before this release".
alter table public.subscriptions add column if not exists pending_checkout_ref text;
comment on column public.subscriptions.pending_checkout_ref is
  'Reference of the card checkout the pending_* columns belong to; the payment webhook must present the same value.';

-- 4. Voucher uses, counted atomically. Checkout read used_count, added one
--    and wrote it back after the order was saved, so two buyers at the same
--    moment could both take the last use of a limited voucher. One statement
--    now adds the use only while uses are left (same shape as
--    claim_flash_quantity). Service role only: checkout calls it server-side
--    (lib/marketplace-ecom/place-order.ts) and falls back to the old count
--    while this function does not exist.
create or replace function public.claim_voucher_use(p_voucher uuid, p_tenant uuid) returns boolean
language plpgsql security definer set search_path = public as $$
declare ok boolean;
begin
  update public.vouchers
     set used_count = used_count + 1
   where id = p_voucher
     and tenant_id = p_tenant
     and (usage_limit is null or used_count < usage_limit)
  returning true into ok;
  return coalesce(ok, false);
end $$;
revoke all on function public.claim_voucher_use(uuid, uuid) from public, anon, authenticated;
grant execute on function public.claim_voucher_use(uuid, uuid) to service_role;

-- Gives a claimed use back when the order could not be saved after all.
create or replace function public.release_voucher_use(p_voucher uuid, p_tenant uuid) returns void
language sql security definer set search_path = public as $$
  update public.vouchers
     set used_count = greatest(used_count - 1, 0)
   where id = p_voucher and tenant_id = p_tenant;
$$;
revoke all on function public.release_voucher_use(uuid, uuid) from public, anon, authenticated;
grant execute on function public.release_voucher_use(uuid, uuid) to service_role;