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
- Riders scoped **per-branch** (locked 2026-09-12, overriding the earlier
  "leaning per-tenant" note below — Wali decided per-branch instead).
- Assign rider to a delivery order, status pipeline
  (assigned → picked_up → delivered), no live location.
- **Shipped 2026-09-12** (090). Riders are a lightweight name+phone table,
  deliberately not tied to auth.users/tenant_members — no login needed to
  be assigned. kitchen_status and delivery_status stay independent columns:
  a delivery order sits at kitchen_status='ready' the whole time a rider is
  assigned/picked up/delivering, only flipping to 'completed' once
  delivery_status reaches 'delivered'. Rider management (add/list) lives
  inline on the kitchen page rather than a separate settings page.

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
- ~~Real Restaurant & Cafe onboarding template~~ — **built 2026-09-12.** 5
  pages (Home, Menu, About, Order Info, Contact), hand-written to match the
  exact block jsonb of the existing "Cleaning service" template rather than
  generated. Menu page uses the ecommerce_products block against the real
  `products` table, so a restaurant's menu items (with dietary_info from
  086) show up there automatically once entered — no separate menu data
  model.

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

- ~~Riders scoped per-branch or per-tenant~~ — **resolved 2026-09-12:
  per-branch.**
- ~~Does `orders` already have a generic status column phase 1 can extend~~
  — resolved: yes (`status`, generic commerce lifecycle), which is exactly
  why `kitchen_status` was added as its own column instead of reusing it.
- Pricing: does restaurant Pro carry a different price than standard Pro, or
  same price with more perceived value? Not decided — flag to Wali before
  the pricing page changes.

## Progress log

- **2026-09-12** — Phases 1-3 shipped and live in production (migrations
  087, 088; commits f5e13d5, 335c03c, 9019141). Schema, QR dine-in ordering,
  kitchen board + table occupancy, POS branch/table picker + 86-toggle all
  working. A real RLS gap (public read policies with no tenant scoping) was
  found while building phase 3 and closed in the same session — see 088.
  The Restaurant & Cafe onboarding template (089) also shipped the same day
  — 5 pages, hand-written to match an existing published template's block
  schema rather than AI-generated, at Wali's direction to skip the AiCoder
  pipeline entirely for this. Phase 4 (riders, per-branch) shipped the same
  day (090) — schema, assignment on the kitchen board, delivery status
  pipeline independent of kitchen_status.
- **2026-09-12 (later same day)** — two gaps found in the phase 1-4 work,
  closed: (a) a Branches admin page (/dashboard/branches) — until this
  existed, adding a branch or table meant a direct DB insert, which
  blocked onboarding a second real restaurant without Claude doing it by
  hand. Includes QR image generation and a printable table-tent view, via
  a public keyless QR image API rather than a new npm dependency for one
  feature. (b) order-confirmation page always showed a "Delivery address"
  block regardless of fulfillment_type — a dine-in or pickup order showed
  a blank address section and generic "thank you for your purchase" copy
  that never mentioned the table or pickup time. Fixed to branch on
  fulfillment_type properly.
- Only phase 5 (printer bridge) remains, explicitly deferred until the
  ordering+POS flow has real customer usage behind it.

---

## Phase 6 planning (2026-09-14) — the restaurant vertical becomes a real
## product line, not a proof of concept

Discussed with Wali after the platform-analytics gap surfaced (a dashboard
analytics build from an earlier session existed and was recording real data
for 16 tenants, but had no visible presence on the dashboard home — nav-only
discoverability isn't real discoverability; the fix is a summary card on
the dashboard home, not backend work).

### Pricing/gating decision — supersedes nothing, adds to it

**Biz plan price cut: ৳20,000/mo → ৳15,000/mo, $160/mo → $120/mo** (yearly
follows the existing 8x-monthly formula: ৳120,000/yr, $960/yr). Rationale:
restaurant ops is "a concurrent business process" in Wali's words — Biz
becomes the tier for a business actually *running* on the platform day to
day, not just "more pages than Pro". This is a real price change to the
live Dodo catalog (same mechanism as the Basic/Pro cuts earlier — product
price update via the SDK, no new product needed since Biz already exists in
both live and sandbox).

**Restaurant stack (POS, Kitchen, Monitor, Table, Riders) now gates to Biz
specifically**, not "any paid plan" as it effectively was before (branches/
kitchen/POS nav items had no plan check at all — gated only by whether
`restaurant_branches` rows existed, which any tenant could create via the
API regardless of plan). This is a real enforcement gap to close: the
nav-visibility gating was never actually plan-aware. Needs a plan check
added to the branches/kitchen/POS pages and their API routes, not just the
sidebar link.

Deliberately **not** a new pricing tier — Wali's call, keeps one Pro/Biz
ladder everywhere rather than a restaurant-specific SKU, consistent with
the platform's "affordable vs agencies" positioning. Means restaurant
revenue per customer is capped at Biz's price; the bet is retention/volume,
not per-customer revenue matching regional POS competitors (Toast,
Foodics).

### Kitchen status vocabulary — real rebuild, not a rename

Current `kitchen_status` enum (`new/preparing/ready/served/completed`) is
generic across every fulfillment type. Wali wants a fulfillment-type-aware
path instead:

- **Dine-in:** Pending → Cooking → Ready → Served on Table
- **Pickup:** Pending → Cooking → Ready to Pick → Picked Up
- **Delivery:** Pending → Cooking → Ready to Pick → Out for Delivery →
  Delivered

Note delivery's "Out for Delivery → Delivered" overlaps with the existing
`delivery_status` column (assigned/picked_up/delivered) from phase 4 — this
needs reconciling, not two parallel status tracks for the same trip. Likely
resolution: `kitchen_status` stops at "Ready to Pick" for delivery orders,
and the existing rider-assignment/`delivery_status` pipeline (already
built, already correct) owns everything after that — matches how phase 4
was designed (kitchen tracks the food, delivery_status tracks the trip).
Decide the exact enum values and whether this is one column with
fulfillment-conditional allowed-values or genuinely different columns
before writing the migration — don't guess mid-build.

### Three toggleable screens — new architecture, most of this is new build

Restaurant admin/manager can independently toggle which of these three
interfaces are active for their operation (`restaurant_branches` or a new
settings row needs a per-screen enabled flag):

1. **KITCHEN** (exists, `/dashboard/kitchen`) — staff-facing, tap to
   advance status. Needs the new status vocabulary above.
2. **MONITOR** (new) — public-facing display, order number + queue only,
   no interaction. Meant for a TV/screen visible to waiting customers
   (common in Gulf/Malaysia/Singapore quick-service and food-court
   settings). Shows order numbers in each status stage, nothing customer-
   identifying (no names/tables, matches the public nature of the screen).
3. **TABLE** (new) — per-table tablet, PIN/passcode set by staff or
   management, customer-facing self-service ordering + status view for
   that specific table. Different from the QR dine-in flow already built
   (phone-based, no PIN) — this is a dedicated device left at the table,
   needs its own lightweight auth (a short PIN, not a full login) scoped
   to one table for one seating.

### Rider app — separate, minimal, not folded into the main admin app

Confirmed: build a distinct, lightweight surface for riders (PWA/web-first,
matching the platform's existing pattern, not a native app project) rather
than adding a rider role inside the main dashboard app. A rider needs
almost nothing — their assigned deliveries, one tap to advance
picked_up/delivered, maybe an address map link. Bundling that into the full
admin app means exposing an irrelevant, heavier surface (billing, settings,
pages) to a rider's phone for no reason. The backend for this
(`restaurant_riders`, `delivery_status`) already exists from phase 4; this
is a thin UI layer on infrastructure already built, not new backend work.

### Admin app — stays one generic app, not a second restaurant-only app

Confirmed: no second admin app. Same pattern already used on the web
dashboard (module-gated nav items) extends to the native admin app —
restaurant sections appear conditionally based on plan + branch setup,
same codebase, not a fork. A second app doubles maintenance forever for a
small team and would still need to re-include most of the generic CMS
surface anyway (business profile, subscription, users) since restaurant
owners want that too.

### Printer notification at signup — new, small

When a restaurant tenant is set up (or Biz-upgrades), the dashboard should
prompt them that they'll need a POS printer/device and suggest a specific
model — this was planned back in phase 5 (Sunmi V2 Pro) but never surfaced
to the customer anywhere. Small UI addition, not a new integration.

### Priority order agreed for execution

**Tier 1 (do first — table stakes for a sellable restaurant product):**
1. Menu modifiers/variants (size, add-ons, free-text notes) — biggest real
   gap; the menu is currently plain ecommerce products with dietary tags
   bolted on, no variant pricing at all. Nothing else matters if a
   restaurant literally cannot price "large fries +$1" correctly.
2. Kitchen status vocabulary rebuild (this section) + gate restaurant
   stack to Biz plan (this section) + Biz price cut on live Dodo catalog.
3. MONITOR screen (new).
4. TABLE screen with PIN auth (new).
5. Printer bridge (Sunmi V2 Pro) — was phase 5, now genuinely urgent once
   a real Biz customer exists.
6. Rider PWA (new, thin layer on existing backend).
7. Dashboard-home analytics summary card — surfaces the already-working
   analytics build, not new backend.

**Tier 2 (retention, after Tier 1 is live and stable):**
8. Restaurant-specific sales analytics (best-sellers, peak hours, ticket
   size) — was the original phase-6-planning list item #4, still valid,
   sequenced after the core ops stack because an owner needs the ops tools
   working before they care about analytics on top of them.
9. Table reservations (Middle East dining pattern skews toward this more
   than BD/casual markets).
10. Inventory auto-deduction + low-stock flagging tied to order
    completion.

**Tier 3 (explicitly not now):**
- Split-bill/per-seat billing.
- Live rider GPS tracking.
- Load-testing kitchen board under real concurrent order volume — real
  concern, but there's no real customer volume to test against yet; revisit
  once a paying restaurant is live.
- Offline-tolerant POS (queue sales locally, sync on reconnect) — real
  operational need for patchy-connectivity venues, but a genuinely separate
  engineering project (local-first data layer), not a quick addition.

### Status reconciliation — resolved

**Confirmed by Wali:** `kitchen_status` stops at "Ready to Pick" for
delivery orders — the existing `delivery_status` column (assigned →
picked_up → delivered, phase 4) owns everything after that. Kitchen tracks
the food, delivery_status tracks the trip, no duplicated state. Matches how
phase 4 was already designed; this just makes it explicit for the new
vocabulary. Full resolved mapping:

- Dine-in: `pending` → `cooking` → `ready` → `served` (kitchen_status only,
  delivery_status stays null — no trip)
- Pickup: `pending` → `cooking` → `ready_to_pick` → (customer collects;
  `picked_up`-equivalent is just marking the order complete, still
  kitchen_status only — a pickup has no rider/trip either)
- Delivery: `pending` → `cooking` → `ready_to_pick` (kitchen_status stops
  here) → `assigned` → `picked_up` → `delivered` (delivery_status takes
  over)

### Not yet decided, flag before building

- Whether the per-screen toggle (KITCHEN/MONITOR/TABLE) lives on
  `restaurant_branches` (per-branch) or a tenant-level settings row —
  branches already carry most restaurant config, leaning per-branch, but
  confirm before the migration.
- TABLE screen PIN mechanism specifics: numeric PIN length, who resets it,
  whether it's per-table-per-day or persistent until changed.
  ordering+POS flow has real customer usage behind it.
