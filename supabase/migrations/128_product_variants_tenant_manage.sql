-- Store owners/editors could not add or change sizes (product_variants) for
-- their own single-store products: the only write policies were the platform
-- admin role and marketplace vendors. Let the tenant's editors manage variants
-- of products that belong to their site.
drop policy if exists product_variants_tenant_manage on public.product_variants;
create policy product_variants_tenant_manage on public.product_variants
  for all
  using (exists (select 1 from public.products p where p.id = product_variants.product_id and p.vendor_id is null and public.is_tenant_editor(p.tenant_id)))
  with check (exists (select 1 from public.products p where p.id = product_variants.product_id and p.vendor_id is null and public.is_tenant_editor(p.tenant_id)));
