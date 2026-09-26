-- Drop anonymous direct-insert policies nothing legitimate uses.
--
-- Each of these tables had a public INSERT policy with `with check (true)`,
-- letting anyone with the anon key insert rows straight through
-- /rest/v1/<table> — any tenant_id, and any value for fields the app
-- normally computes server-side:
--
--   marketplace_bookings     price, commission_amount, vendor_id, status
--                            (e.g. a "confirmed" booking at a fake price
--                            against a real vendor — commission math reads
--                            these fields)
--   service_requests         status, claimed_by_vendor_id
--   restaurant_reservations  status
--   marketing_leads          status
--
-- Every real form submission already goes through a server route that
-- validates input and inserts with the service-role admin client
-- (lib/marketplace/bookings.ts, api/marketplace/public/requests,
-- api/ecommerce/reservations, api/marketing-lead), which bypasses RLS and so
-- never needed these policies. Found 2026-09-26.

drop policy if exists marketplace_bookings_public_insert on marketplace_bookings;
drop policy if exists service_requests_public_insert on service_requests;
drop policy if exists restaurant_reservations_public_insert on restaurant_reservations;
drop policy if exists ml_insert on marketing_leads;
