# Pricing & Packaging — Rationale

Last updated: 2026-09-02. Owner: Wali.

Purpose: record *why* each pricing decision was made, so it is not re-litigated
every few weeks. If you change a price, update this file in the same commit.

---

## Current pricing

Source of truth is the `plans` table. This table must match it.

| Plan | Monthly | Yearly (30% off) | BDT monthly | BDT yearly | Visitors/mo | Pages | Overage /1k |
|---|---|---|---|---|---|---|---|
| Basic | $40 | $336 | ৳5,000 | ৳42,000 | 5,000 | 6 | $2 |
| Pro | $80 | $672 | ৳10,000 | ৳84,000 | 25,000 | unlimited | $1 |
| Biz | $160 | $1,344 | ৳20,000 | ৳168,000 | 100,000 | unlimited | $1 |
| Custom | — | — | — | — | — | unlimited | — |

BDT prices are **fixed**, not converted at the live rate. A round ৳10,000 reads
as a real price; ৳9,847 reads as a foreign price badly translated.

---

## Decision: monthly-first, yearly at 30% off

**Decided 2026-09-02 by Wali.** Supersedes the earlier 50% yearly decision.

Monthly is the headline everywhere — in the video, on the pricing page, in the
WhatsApp quote. Yearly is a loyalty discount offered at checkout, not a
competing headline.

**Why monthly leads:**
- Lower barrier for a buyer who has been burned by a vanishing freelancer.
  $80 to start is a far easier yes than $480 upfront.
- Recurring billing is what the product actually is. Selling it as an annual
  lump sum was a WordPress-build habit.
- It shortens the gap between signup and first payment, which is the metric
  that has been broken all along.

**Why 30% and not 50%:** at 50%, marketing the monthly price makes monthly look
like a penalty — a customer who reads both prices feels overcharged for
choosing the flexible option. 30% (paying for roughly 8.4 months out of 12) is
a real incentive that does not undercut the headline.

**Cost of monthly-first:** first-year cash is materially thinner than annual
prepayment. Accepted deliberately — a customer who pays $80 once and stays is
worth more than one who prepays $240 and churns at renewal.

**Revisit when:** 20+ paying customers, or when the first renewals land.
Grandfather existing customers when raising.

---

## Decision: page limits

**Decided 2026-09-02 by Wali.**

Basic is capped at **6 pages**; Pro and Biz are unlimited.

Templates needing more pages than the plan allows are **hidden from the picker**
rather than offered and rejected on apply. Basic keeps 12 of 24 published
templates — a real constraint, not a crippled tier, and the hidden count is
shown as an upgrade prompt.

**Enforcement is a database trigger** (`trg_enforce_page_limit` on `pages`), not
a client check. Pages are created from several places — new page, duplicate,
AiCoder site build — writing to Supabase directly, so a UI guard would not hold.

**Grandfathering:** `tenants.pages_limit_override` overrides the plan cap
(NULL = use plan limit, -1 = unlimited). The 7 existing Basic tenants already
over 6 pages were set to their current count, so nobody lost a page. Use this
column for any future limit change — never apply a cap retroactively.

---

## Decision: payment rail follows currency

**Decided 2026-09-02 by Wali.**

| Currency | Gateway |
|---|---|
| USD | Dodo Payments |
| BDT | shurjoPay |
| Anything else / bank transfer | Manual, arranged over WhatsApp |

The payment step shows only the rail matching the selected currency. Offering
both invites a charge the gateway will reject.

Biz now has real Dodo product IDs and is purchasable by card like Pro.
**Outstanding:** create `biz_monthly` and `biz_yearly` products in the Dodo
dashboard and paste the IDs into Super Admin → Settings, or Biz card checkout
returns "No Dodo product ID configured".

---

## Decision: ENM is bundled, not sold separately

**Decided 2026-09-02 by Wali.**

Model: **free ENM listing available to everyone; ENM Pro included with CMS Pro
and Biz.**

**Why:**
1. ENM cannot take payments — gateway policy. Bundling routes all revenue
   through the CMS rails, which work.
2. Free listings build supply density and SEO surface without needing a checkout.
3. It keeps a standalone ENM funnel alive for **phase D** (trade associations),
   where per-seat pricing will be needed.

**Entitlement rule:** `enmTierForPlan()` in `src/lib/enm-tier.ts` is the single
source of truth. It was previously inlined at four call sites and three had
missed Biz, so a Biz customer paid for the bundle and received the free tier.

**Provisioning is opt-in, not automatic.** Creating a directory profile for
everyone who buys a website produces listings nobody asked for and inflates the
expert count. The owner opts in from a card on the subscription page. See
[05-business-profile-design.md](05-business-profile-design.md).

**Cost of this decision:** ENM stops being independently revenue-validated. We
will not learn what someone pays for ENM alone. Correct trade for now; revisit
before phase D.

**Dependency:** `ENM_BASE_URL` must point at a live host. It pointed at the
lapsed `expertnear.me` until 2026-09-02, so every provision call failed
silently. Now `https://expertnearme.vercel.app` — change back once the domain is
re-registered.

---

## Decision: card payment is the default at signup

**Changed 2026-09-02.**

Previously "Pay Later" was the default and the only card option was hidden and
disabled. Result: 29 subscriptions, 0 payments.

Now card is default and listed first; "Pay Later" remains available but
demoted. The site is created *before* checkout, so abandoning payment leaves the
customer with a working site and us with a billable account — which is what the
reactivation sequence then works on.

WhatsApp is required at signup. It is the channel this segment actually reads,
and the funnel SOP depends on having it.

---

## Discount policy

- **Never discount before an objection.** Yearly at 30% is already the discount.
- No stacking. The yearly discount is the discount.
- Grandfathering is permitted and encouraged for early customers — cheaper than
  acquisition, and already promised in the reactivation SOP.
- Free months as service recovery: allowed, max 1 month, and only when we
  actually got something wrong.
- Never discount to win a price-shopper against a $50 one-pager. That customer
  churns. See [01-positioning.md](01-positioning.md) §2.

---

## When to raise prices

Trigger conditions, any one:
- 20+ paying customers with <10% monthly churn
- Consistent conversations where price never comes up as an objection
- Support cost per customer exceeding ~15% of their monthly fee

How:
1. Grandfather every existing customer at their current price, permanently
2. Raise new-customer pricing first; wait a full billing cycle
3. Normalise the yearly discount before touching monthly rates

---

## What is NOT decided yet

- **Biz Dodo products** — must be created in the Dodo dashboard (see above)
- **AiCoder top-up packages** — checkout and pricing still unbuilt; the Dodo
  rail now works, so this is unblocked
- **ENM phase D pricing** (associations, per-seat) — deliberately deferred
- **Overage enforcement** — rates are published but nothing meters or bills
  them. Publishing a rate we do not charge is a claim we cannot defend; either
  implement it or remove it from the pricing page.
- **Dunning / failed-payment recovery** — no retry, no reminder, no suspension
  flow for a card that fails on renewal. Monthly billing makes this urgent in a
  way annual billing did not: with monthly, a failed charge happens 12x more
  often.
