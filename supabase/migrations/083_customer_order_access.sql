-- Customer-facing order history (2026-09-06).
--
-- orders.customer_id has been written on every logged-in checkout since the
-- storefront checkout route was built ("so it shows up in order history" —
-- see api/storefront/checkout/route.ts) but no policy ever let a customer
-- actually read their own rows. The only existing SELECT policy,
-- orders_tenant_manage, is gated on is_tenant_member — staff only. A real
-- customer querying their own orders got zero rows back, silently, with no
-- error, because that's exactly what RLS does when nothing grants access.
--
-- This adds the missing grant: a customer may read (and only read) rows
-- where they are the customer. No tenant check needed in this policy —
-- customer_id already uniquely scopes to rows that are theirs regardless of
-- which tenant placed them, and a customer legitimately may have ordered
-- from more than one tenant's storefront (each tenant is a separate store on
-- the same platform).
create policy orders_customer_read_own
  on public.orders
  for select
  using (customer_id = auth.uid());
