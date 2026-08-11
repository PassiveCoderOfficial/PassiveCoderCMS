-- Let a seller read their own vendor row, and expose ONLY safe shop fields
-- publicly.
--
-- vendors_read covers staff and super admins only, so a signed-in seller could
-- not see the shop they own. Login uses that lookup to route sellers to the
-- Seller Centre, and the portal needs it for the shop name and commission rate.

drop policy if exists vendors_self_read on public.vendors;
create policy vendors_self_read on public.vendors
  for select using (user_id = auth.uid());

-- Deliberately NOT a public SELECT policy on the table. vendors holds seller
-- PII and commercial terms — phone, email, NID, trade licence, bank account,
-- bKash number and commission_rate. Storefront pages need only the shop's
-- public identity, so that subset is exposed through a view instead and the
-- base table stays closed to anonymous readers.
drop policy if exists vendors_public_read on public.vendors;

create or replace view public.vendor_public_profiles
with (security_invoker = off) as
  select id, tenant_id, name, slug, logo, banner, description,
         rating, rating_count, pickup_area, created_at
    from public.vendors
   where status = 'approved'
     and 'ecommerce' = any(capabilities);

comment on view public.vendor_public_profiles is
  'Storefront-safe seller identity. Excludes phone, email, NID, trade licence, bank/bKash details and commission_rate.';

grant select on public.vendor_public_profiles to anon, authenticated;
