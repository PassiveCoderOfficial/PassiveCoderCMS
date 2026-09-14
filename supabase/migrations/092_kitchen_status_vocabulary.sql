-- Restaurant vertical phase 6 (docs/business/06-restaurant-vertical.md):
-- replaces the generic kitchen_status vocabulary (new/preparing/ready/
-- served/completed, identical across every fulfillment type) with a
-- fulfillment-type-aware one. A dine-in order ends "Served on Table"; a
-- pickup order ends "Picked Up"; a delivery order stops at "Ready to Pick"
-- and hands off to the existing delivery_status pipeline (assigned ->
-- picked_up -> delivered, phase 4) rather than duplicating trip state here.
--
-- New vocabulary (one column, fulfillment-conditional allowed values --
-- decided over a genuinely separate column per type, since the values that
-- ARE shared, pending/cooking, would otherwise need keeping in sync across
-- three enums for no benefit):
--   pending, cooking            -- every fulfillment type starts here
--   ready                       -- dine-in only: food is ready to serve
--   served                      -- dine-in only: terminal
--   ready_to_pick               -- pickup AND delivery: food is ready
--   picked_up                   -- pickup only: terminal (customer collected)
--   completed                   -- delivery only: terminal, set once
--                                  delivery_status reaches 'delivered'
--
-- Old rows already sitting in 'new'/'preparing'/'ready'/'served'/'completed'
-- get mapped forward rather than left to violate the new constraint --
-- 'new'->'pending', 'preparing'->'cooking', the rest keep their name where
-- it already matches (ready, served, completed all reused verbatim).
update public.orders set kitchen_status = 'pending' where kitchen_status = 'new';
update public.orders set kitchen_status = 'cooking' where kitchen_status = 'preparing';

alter table public.orders drop constraint if exists orders_kitchen_status_check;
alter table public.orders add constraint orders_kitchen_status_check
  check (kitchen_status in (
    'pending', 'cooking', 'ready', 'served', 'ready_to_pick', 'picked_up', 'completed'
  ) or kitchen_status is null);

comment on column public.orders.kitchen_status is
  'Fulfillment-aware kitchen pipeline. Dine-in: pending->cooking->ready->served. '
  'Pickup: pending->cooking->ready_to_pick->picked_up. '
  'Delivery: pending->cooking->ready_to_pick, then delivery_status '
  '(assigned/picked_up/delivered) takes over; kitchen_status is set to '
  'completed once delivery_status reaches delivered. Null for non-restaurant orders.';

-- ─── Per-branch screen toggles ───────────────────────────────────────────
-- KITCHEN (staff, tap to advance), MONITOR (public display, order number +
-- queue only), and TABLE (per-table tablet, PIN-gated customer ordering)
-- are independently toggleable by the branch's own manager. Living on
-- restaurant_branches rather than a tenant-level settings row: branches
-- already carry the rest of this tenant's restaurant config (address,
-- phone), and a multi-branch tenant may legitimately want MONITOR on at
-- one location and off at another (e.g. a food-court unit vs a sit-down
-- location).
alter table public.restaurant_branches
  add column if not exists kitchen_screen_enabled boolean not null default true,
  add column if not exists monitor_screen_enabled boolean not null default false,
  add column if not exists table_screen_enabled boolean not null default false;

comment on column public.restaurant_branches.kitchen_screen_enabled is
  'Staff-facing kitchen board (/dashboard/kitchen). On by default -- this is the core ops screen.';
comment on column public.restaurant_branches.monitor_screen_enabled is
  'Public-facing order-number/queue display, meant for a TV/screen visible to waiting customers. Off by default -- not every restaurant has a screen to put it on.';
comment on column public.restaurant_branches.table_screen_enabled is
  'Per-table tablet ordering, PIN-gated per table. Off by default -- requires physical tablets the restaurant may not have yet.';

-- ─── TABLE screen PIN ─────────────────────────────────────────────────────
-- A short numeric PIN per table, set by staff/management, scoping a
-- table-side tablet to that one table for as long as the PIN is valid.
-- Persistent until explicitly changed (not per-seating/per-day) -- simplest
-- operationally, matches how the table's qr_token already works (stable
-- until the table itself changes), and staff resetting a PIN after every
-- seating would be real friction for no real security gain (the tablet is
-- physically at the table either way).
alter table public.restaurant_tables
  add column if not exists table_pin text;

comment on column public.restaurant_tables.table_pin is
  'Short numeric PIN scoping a table-side tablet to this table for the TABLE screen. Null = TABLE screen not set up for this table yet. Persistent until staff changes it, not per-seating.';
