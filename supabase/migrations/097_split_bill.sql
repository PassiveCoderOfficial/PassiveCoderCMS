-- Restaurant vertical Tier 3, item #1 (docs/business/06-restaurant-vertical.md):
-- split-bill / per-seat billing. Deliberately the simplest workable shape:
-- a dine-in table's cart gets partitioned into N sub-bills (evenly or by
-- manually assigning items to a seat) BEFORE checkout, then each sub-bill
-- is rung up as its own normal POS order — no new order-level split logic,
-- no partial-payment-against-one-order model. Every existing order
-- feature (kitchen_status, accounting entry, CRM contact) keeps working
-- unmodified per sub-bill; split_group_id is purely a "these N orders came
-- from one table's bill" label for the receipt/history view.

alter table public.orders
  add column if not exists split_group_id uuid,
  add column if not exists split_label text;

create index if not exists orders_split_group_idx
  on public.orders (split_group_id) where split_group_id is not null;

comment on column public.orders.split_group_id is
  'Shared id across every sub-bill produced by splitting one table''s cart (Tier 3 restaurant vertical). Null for a normal, unsplit order.';
comment on column public.orders.split_label is
  'Human label for this piece of a split bill, e.g. "Seat 1" or "Split 2 of 3". Null for a normal, unsplit order.';
