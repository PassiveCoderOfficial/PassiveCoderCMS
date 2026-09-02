# Passive Coder — Business Docs

Working documents for strategy, positioning, and sales operations. Written
2026-09-02 after a full audit of the CMS and ExpertNear.Me funnels.

## Read in this order

1. **[01-positioning.md](01-positioning.md)** — who buys, what we actually sell,
   the language to use. Everything else assumes this.
2. **[02-video-whatsapp-funnel-sop.md](02-video-whatsapp-funnel-sop.md)** —
   video → landing page → WhatsApp → close. Fixes the capture leak in the
   current CTA.
3. **[03-reactivation-sop.md](03-reactivation-sop.md)** — converting the
   tenants who signed up and were never billed.
4. **[04-pricing-and-packaging.md](04-pricing-and-packaging.md)** — why prices
   and bundles are what they are. Update in the same commit as any price change.
5. **[05-business-profile-design.md](05-business-profile-design.md)** — design
   for the business-profile wizard that feeds AI generation, the site, and the
   ExpertNear.Me listing. Not built yet; read before starting it.

## The context these were written in

As of 2026-09-02, before that day's fixes:

- 44 tenants, 5 active, 39 stuck in `onboarded`
- 29 subscriptions, **0 payments and 0 invoices, ever**
- Dodo was fully configured and working; the card option in signup was
  hardcoded hidden and disabled, and pointed at Paddle
- `payMethod` was collected at signup and discarded server-side
- ExpertNear.Me's domain had lapsed; the app itself was live the whole time

The conclusion these docs are built on: **this was never a demand problem or a
build-quality problem. Nobody was ever asked to pay.**

## Maintenance

- Prices change → update `04` in the same commit
- Positioning changes → `02` and `03` inherit from `01`, review both
- Anything claimed publicly must survive a customer checking it — see `01` §6
