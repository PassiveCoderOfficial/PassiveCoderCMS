-- Restaurant pickup/delivery support (2026-09-12).
--
-- place-order.ts hard-required a delivery address on every order
-- (throws "Delivery address is required" unconditionally) -- correct for
-- retail/shipping, wrong for a restaurant taking pickup orders where
-- there's no address at all. Adds the fields needed to branch: which mode
-- this order is, and (for pickup) when the customer said they'd come by.
--
-- Defaults to 'delivery' so every existing order and every other tenant's
-- checkout keeps behaving exactly as before -- this is additive, not a
-- behavior change for anyone not using pickup.
alter table orders
  add column if not exists fulfillment_type text not null default 'delivery',
  add column if not exists pickup_time timestamptz;

alter table orders
  add constraint orders_fulfillment_type_check
  check (fulfillment_type in ('delivery', 'pickup'));
