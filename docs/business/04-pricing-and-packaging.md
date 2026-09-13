# Pricing & Packaging — Rationale

Last updated: 2026-09-13. Owner: Wali.

Purpose: record *why* each pricing decision was made, so it is not re-litigated
every few weeks. If you change a price, update this file in the same commit.

---

## Current pricing

Source of truth is the `plans` table. This table must match it.

| Plan | Monthly | Yearly (4 months free) | BDT monthly | BDT yearly | Visitors/mo | Pages |
|---|---|---|---|---|---|---|
| Basic | $32 | $256 | ৳4,000 | ৳32,000 | 5,000 | 6 |
| Pro | $60 | $480 | ৳7,500 | ৳60,000 | 25,000 | unlimited |
| Biz | $160 | $1,280 | ৳20,000 | ৳160,000 | 100,000 | unlimited |
| Custom | — | — | — | — | — | unlimited |

Yearly is **exactly 8× the monthly price** on every plan — pay for 8 months,
get 12 — so "4 months free" is arithmetically exact, not a rounded label. If a
price ever changes, keep this formula rather than picking an arbitrary
percentage, or the label goes back to being wrong (see 06-restaurant-vertical.md
and the BD landing page fix on 2026-09-13, both born from stale prices drifting
out of sync with what marketing pages said).

There is no overage rate. See below.

BDT prices are **fixed**, not converted at the live rate. A round ৳10,000 reads
as a real price; ৳9,847 reads as a foreign price badly translated.

---

## Decision: monthly-first, yearly at 4 months free (8× monthly)

**Decided 2026-09-02 by Wali, refined 2026-09-13.** Supersedes the earlier 50%
yearly decision, and refines the original ~30%-off framing to an exact 8×
monthly formula so "4 months free" is literally true rather than a rounded
approximation of "roughly 8.4 months out of 12".

Monthly is the headline everywhere — in the video, on the pricing page, in the
WhatsApp quote. Yearly is a loyalty discount offered at checkout, not a
competing headline.

**Why monthly leads:**
- Lower barrier for a buyer who has been burned by a vanishing freelancer.
  $60 to start is a far easier yes than $480 upfront.
- Recurring billing is what the product actually is. Selling it as an annual
  lump sum was a WordPress-build habit.
- It shortens the gap between signup and first payment, which is the metric
  that has been broken all along.

**Why 8× monthly (4 months free) and not 50% off:** at 50%, marketing the
monthly price makes monthly look like a penalty — a customer who reads both
prices feels overcharged for choosing the flexible option. Paying for 8 months
to get 12 is a real incentive that does not undercut the headline, and unlike
a percentage, "4 months free" is a framing a Bangladeshi-expat/probashi
audience reads instantly without doing arithmetic — this is why the BD
landing page moved to this wording first (2026-09-13), then the rest of the
platform matched it rather than running two different discount stories.

**Cost of monthly-first:** first-year cash is materially thinner than annual
prepayment. Accepted deliberately — a customer who pays $60 once and stays is
worth more than one who prepays $180 and churns at renewal.

**Revisit when:** 20+ paying customers, or when the first renewals land.
Grandfather existing customers when raising.

---

## Decision: 7-day trial, card required, "Pay Later" removed entirely

**Decided 2026-09-13 by Wali.** Replaces the old no-card "trial" method
(`method === "trial"` in onboarding, "Get Started — Pay Later" everywhere) —
removed from the onboarding UI, the marketing site's CTAs, and the codebase
entirely.

**Card/Dodo path:** real 7-day free trial via Dodo's native
`trial_period_days` on every subscription product (set directly on the live
and sandbox catalog, all 6 products). Card is saved at checkout, never
charged during the trial, auto-charges on day 8 unless cancelled. This is
Dodo's own mechanism — no custom code needed to enforce it.

**ShurjoPay/manual path:** shurjoPay has no card-on-file/recurring-charge API
in this integration (checked — it's one-shot hosted checkout only), so a
matching auto-charge-after-trial isn't buildable the same way. Instead: the
account activates immediately, nothing is charged at signup, and the
dashboard shows the same 7-day window with a "pay now" prompt (shurjoPay
checkout or WhatsApp/manual arrangement). `subscriptions.trial_ends_at` +
the existing `expire-trials` cron (already built for the old trial
mechanism, reused as-is) suspends the tenant if unpaid when the window
closes. Not a fake auto-charge promise — a real activate-now, pay-during-
window flow, same underlying trial length as the card path.

`subscriptions.payment_method` is now recorded at signup (`dodo` |
`shurjopay` | `manual`) so the dashboard payment-due prompt knows which rail
to offer instead of guessing.

**Existing 14-day trial_ends_at mechanism changed to 7 days** platform-wide
(`create-tenant/route.ts`, both the `tenants` and `subscriptions` rows) —
this was already unconditional on every signup regardless of payment method
chosen; this decision just shortens it to match, rather than running two
different trial-length concepts.

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

## Dunning — built 2026-09-02

Failed-payment recovery ships in v1.0.163 (migration 076, `/api/cron/dunning`,
daily at 03:00 UTC / 09:00 Dhaka).

Escalation over 21 days: **day 1** (soft — "usually just an expired card"),
**day 4** (reminder), **day 10** (action needed, invites a conversation),
**day 21** (suspend).

The site stays up through the entire sequence and is suspended only at the end.
That is deliberate: a dead site cannot pay its invoice, and a customer whose
business page vanished without warning does not come back. Nothing is ever
deleted, and the emails say so.

Both payment webhooks clear open dunning and lift a payment suspension
immediately rather than waiting for the next daily pass.

**If you change the schedule**, keep the last step as the only suspending one,
and keep the early messages non-accusatory — the most common cause of a failed
charge is a replaced card, not an unwillingness to pay.

---

## Decision: the visitor allowance is a soft cap

**Decided 2026-09-02 by Wali.** Built in v1.0.165.

The plan allowance is real and now measured, but **nothing is ever auto-charged
and nothing is auto-suspended for exceeding it.** The published "$2 per 1,000
extra visitors" rate is gone — it was never billed, and an unenforceable
published rate is a direct hit on a position built on being verifiable.

How it works: daily per-tenant counters (migration 077), incremented from the
site layout via `after()` so it cannot slow a page. Obvious crawlers are
excluded — counting Googlebot against an allowance would warn an owner about
traffic they never received. A daily cron emails at 80% and 100% of the
allowance, once per threshold per month.

The emails are framed as the site succeeding, with an upgrade available — not
as a bill. Going over costs the customer nothing.

**If you ever want to bill for overage**, the counters are already there, but
re-read this section first: the pricing page currently promises "No overage
charges", and reversing that on existing customers would be a broken promise,
not a pricing change.

---

## What is NOT decided yet

- **Biz Dodo products** — must be created in the Dodo dashboard (see above)
- **AiCoder top-ups** — actually already live (three packages at $9 / $29 /
  $99, real Dodo product ids, checkout wired into the AiCoder dialog). An
  earlier note here called these unbuilt; that was wrong.
- **ENM phase D pricing** (associations, per-seat) — deliberately deferred


