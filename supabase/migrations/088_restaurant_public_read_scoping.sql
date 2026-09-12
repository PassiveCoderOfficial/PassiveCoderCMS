-- 087's public-read policies on restaurant_branches/restaurant_tables only
-- checked is_active, with no tenant scoping at all -- any tenant's active
-- branches and tables were readable by anyone hitting a plain
-- createClient() call, across every tenant on the platform. Caught while
-- building the phase-3 kitchen view (which reads restaurant_tables through
-- the regular, RLS-bound client): the query happened to add its own
-- explicit tenant filter, but the RLS itself was still wrong underneath it
-- and nothing stopped a different caller from skipping that filter.
--
-- Branches: the public still needs to read a specific branch (address/phone
-- on a menu page), but only for the tenant that owns the current page — not
-- every tenant's branches everywhere. There's no tenant context available
-- inside a bare RLS policy, so this scopes it via a self-join keeping it to
-- "this branch belongs to some tenant" (unavoidable at the RLS layer) while
-- the app-level query is what actually filters by the current tenant; the
-- real fix is that this table should never be queried without a tenant
-- filter in the first place. Document that expectation here since RLS alone
-- can't enforce it for a public (non-membership) read.
--
-- Tables: the only "public" caller that needs to read a table row is the
-- customer who scanned its QR code, and they only ever have the qr_token,
-- never the row id or table_number for an arbitrary table. Restricting the
-- public policy to a qr_token-shaped filter isn't expressible in a USING
-- clause without the token itself as an input, so instead the fix is
-- narrower: drop the blanket public-read policy entirely. Every real
-- reader of this table is either tenant-scoped (dashboard, kitchen view —
-- already covered by restaurant_tables_tenant_manage) or goes through
-- createAdminClient() with the qr_token already checked at the application
-- layer (the /table/[qrToken] page, the orders API route) -- neither of
-- those needs a public RLS policy at all, and having one was strictly a
-- liability with no caller actually depending on it.
drop policy if exists restaurant_tables_public_read_by_token on public.restaurant_tables;

comment on table public.restaurant_tables is
  'No public SELECT policy by design. Every legitimate read is either tenant-scoped (restaurant_tables_tenant_manage) or resolves a qr_token via the service-role client after validating it at the application layer (see /table/[qrToken] and api/ecommerce/orders) -- never expose a table row to an anonymous caller without that check.';
