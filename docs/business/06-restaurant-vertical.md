# Restaurant Vertical — Plan

Last updated: 2026-09-12. Owner: Wali. Status: planning, no code shipped yet
except the two prep migrations noted below.

Purpose: sell CMS Pro to restaurants with a website + ordering app (dine-in,
pickup, delivery) as the pitch, and a POS as the reason they don't churn.
Record scope, phase order, and the decisions behind them so this isn't
re-litigated once building starts.

---

## Why this is a different sell than other verticals

Every other template (trade services, cleaning, renovation) sells a website.
A restaurant customer is sold **infrastructure they run their business on
every day** — ordering + POS. That is stickier than a marketing site and
justifies Pro pricing on its own, but it also means:

- Downtime or a broken order flow is a same-day support fire, not a "we'll
  fix it next sprint" bug. This vertical raises the support bar.
- The website is the demo. The POS is the retention mechanism. Build in that
  priority order — a beautiful ordering page with a broken POS is unsellable
  after week one; a plain ordering page with a rock-solid POS is not.

---

## What already exists (built before this plan, reuse it)

- `products` table — doubles as the menu. `086_product_dietary_info.sql`
  added `dietary_info jsonb` (spice level, veg/non_veg/vegan, tags).
- `orders` table — `085_order_fulfillment_type.sql` added
  `fulfillment_type` (`delivery` | `pickup`, default `delivery`) and
  `pickup_time`. **`dine_in` is not yet a valid value — phase 1 adds it.**
- POS screen (`src/app/(admin)/dashboard/pos/pos-client.tsx`) — tap-to-add
  cart, cash/bkash/nagad/card, discount, receipt. Counter-service only today;
  no table concept, no order-status pipeline, no printer.
- Marketplace vendor architecture ([[project_marketplace_module]]) — shared
  `vendors` table pattern already proven for multi-tenant-with-sub-entities.
  Branches reuse this shape rather than inventing a new one.
- Ecommerce checkout (`place-order.ts`) — hard-required a delivery address on
  every order until 085; that block is already fixed.

## What's genuinely new

Branches, tables/QR ordering, a kitchen order-status pipeline, rider
assignment, and a printer bridge. None of this exists yet.

---

## Scope decisions (locked 2026-09-12)

**Dine-in table identification: QR code per table.** Each table gets a
stable code; the QR links to the menu pre-filled with that table's branch +
table number. No app install, no asking staff for a number, no typing errors.

**Multi-branch from day one.** One tenant (one restaurant owner) can have
several physical locations. Rejected single-location-only for v1 because a
chain owner is exactly the kind of customer who pays for Pro and doesn't
churn — building single-location first would mean redoing the schema under
live data later. Shared product catalog across branches, per-branch
availability/stock override (a branch can 86 an item without touching the
menu everywhere else).

**Rider assignment + status tracking, not just address capture.** Delivery
orders get a rider_id and a status pipeline (assigned → picked_up →
delivered). Live GPS tracking is explicitly out of scope for this build —
that's a real v3, not a checkbox. Basic status is enough for an owner to
answer "where's my order" without calling the rider.

---

## Phases

### Phase 1 — Schema foundation
- `restaurant_branches` table: tenant_id, name, address, phone, is_active.
- `restaurant_tables` table: branch_id, table_number, qr_token (unique,
  unguessable — not sequential, this is a public URL param).
- `orders.fulfillment_type` check constraint gains `dine_in`.
- `orders` gains `branch_id`, `table_id` (nullable, dine_in only).
- `orders` gains `status` pipeline column if it doesn't already track this
  (check `orders` schema before assuming — do not duplicate an existing
  status field).
- Product availability: per-branch override table (`branch_product_availability`:
  branch_id, product_id, in_stock bool) rather than a column on `products`,
  so the shared-catalog decision above actually holds.

### Phase 2 — Customer ordering flow (the demo, build this first after schema)
- Public menu page reads branch_id (+ table_id when present from QR scan).
- Fulfillment selector: Dine-in (locked to the scanned table, no picker) /
  Pickup (time picker, reuses `pickup_time`) / Delivery (address form).
- Checkout wired through existing `place-order.ts`, extended for
  `dine_in` + branch/table.
- QR code generation + printable table-tent PDF for onboarding (owner prints
  and puts on tables day one — this is part of the sales demo).

### Phase 3 — POS + kitchen pipeline
- POS reads live orders filtered to its branch, not just walk-in sales.
- Order status pipeline surfaced as a kitchen view: new → preparing → ready
  → served/out-for-delivery → completed.
- Table view: which tables are occupied, which order belongs to which table.
- Menu 86-toggle: fast in-stock/out-of-stock flip per branch, no full edit
  flow needed for this.

### Phase 4 — Rider assignment
- Rider role under tenant (or branch — decide at build time based on whether
  riders are shared across a chain's branches, likely yes for BD context).
- Assign rider to a delivery order, status pipeline
  (assigned → picked_up → delivered), no live location.

### Phase 5 — Printer bridge
- Ship after the ordering + POS flow is provably solid, not before — a
  restaurant can operate on POS-screen-only for early customers while this
  lands.
- Hardware pick: Sunmi V2 Pro (Android, built-in 58mm thermal printer,
  available internationally incl. Bangladesh, no on-site install). POS
  detects a Sunmi JS bridge if present and calls it; falls back to the
  browser print dialog on any other device so nothing breaks for a customer
  without the hardware.

### Not in this build (explicitly deferred)
- Live rider GPS tracking.
- Table reservations / booking.
- Split-bill / per-seat billing.
- Real Restaurant & Cafe onboarding template — "Restaurant & Cafe" exists
  today only as a template *category* label; no template row backs it. Build
  after phase 2 ships, using a real customer's site as the reference rather
  than guessing menu-section conventions in advance.

---

## Marketing (regular)

- Local SEO / Google Business Profile — menu, hours, photos. Already the
  standard playbook per [[project_passive_coder_business]] GBP automation.
- WhatsApp ordering as a fallback CTA next to the web menu — the same lesson
  as CMS signup itself: BD/expat customers message before they fill forms.
- Reels of food, standard organic-reach category for restaurants.
- Post-order WhatsApp review-request loop, direct Google Maps link.
- Repeat-customer WhatsApp/SMS blast for new items and weekday deals.

## Marketing (viral)

- UGC challenge: tag the restaurant eating a dish → discount next visit.
  Cheap, self-propagating.
- Scarcity micro-drops ("only 20 made today") — performs well on Reels.
- Founder/kitchen-behind-the-scenes Reels — homeland-authenticity angle
  resonates hard with the BD-expat audience this platform already targets.
- WhatsApp referral codes — reuses `customer_profiles` (already shipped per
  084_customer_profiles_wishlists.sql), add a referral_code column when this
  phase is built.

---

## Open questions for next planning pass

- Riders scoped per-branch or per-tenant (shared pool across a chain)?
  Leaning per-tenant for BD context but not locked — decide at phase 4.
- Does `orders` already have a generic status column phase 1 can extend, or
  does one need to be added? Check before writing the migration.
- Pricing: does restaurant Pro carry a different price than standard Pro, or
  same price with more perceived value? Not decided — flag to Wali before
  the pricing page changes.
