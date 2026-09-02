# SOP — Reactivating the Dead Pipeline

Last updated: 2026-09-02. Owner: Wali.
Assumes [01-positioning.md](01-positioning.md).

---

## What happened, stated plainly

44 tenants exist. 5 are `active`. 39 sit in `onboarded` and have sat there for
up to 5 months. There are 29 subscription rows and **zero payments and zero
invoices, ever.**

This was not customer rejection. Until 2026-09-02 the card payment option in
signup was hardcoded `disabled: true, hidden: true` and pointed at Paddle, a
gateway we do not use. `payMethod` was collected and then discarded
server-side. **Nobody was ever asked for money.**

That matters for tone: these people did not refuse to pay. We never presented a
bill. Approach them as an oversight on our side, because it was.

---

## Triage — be honest about the list

Do not treat "39 tenants" as 39 leads. Sorted by real evidence of work:

### Tier A — clear real businesses, real content (contact first)

Sites with content well beyond the seeded template default of ~8 pages:

| Site | Pages | Created | Plan chosen |
|---|---|---|---|
| Free Bird SG | 33 | 2026-08-18 | — |
| Redefine Painting SG | 20 | 2026-08-09 | — |
| SGP Floor Repair | 13 | 2026-07-30 | — |
| SUTEKI Engineering PTE LTD | 10 | 2026-07-19 | pro |
| Electrical/plumbing/glass Windsor | 10 | 2026-08-01 | basic |
| Baby food | 9 | 2026-07-16 | pro |

Six sites. Someone sat down and did hours of work. These are the real leads.

### Tier B — plausible businesses at template default (~7–8 pages)

Afnan United, Aftan United, Furnitureworld, Jersey BD, BD Chaining, cealining,
Painting, ARA M&E Construction, Tarikul Islam, Maktomine, and similar.

**Caution:** ~8 pages is what template seeding creates on its own. It is *not*
evidence of effort. Treat as cold leads, not warm ones. Check each site by eye
before contacting.

### Tier C — do not contact

- Internal/test: `test`, `demosite`, `demotemplatechecking`, `sitename`, `2wswwsw`
- Ours: `wali`, `araconstruction`, `myservicesg` (owner is walibdpro@gmail.com)
- Obvious throwaway emails (e.g. `...@gonrr.net`)
- Duplicates — several emails own 2–3 tenants (`awalr7312@`, `studentdawe443@`,
  `mtarikulshikdar@`, `hmdarmanhossain721@`). **Contact the person once, about
  their best site — not once per tenant.**

**Realistic count after triage: roughly 6 warm and 10–12 cold. Not 39.**
Better to know that now than to plan revenue against a number that is not real.

---

## Before contacting anyone — preflight

1. **Open the site.** If it looks unfinished or default, it changes the message.
2. **Confirm card payment now works** — sign up on a test tenant and reach Dodo checkout.
3. **Deduplicate by email.** One person, one conversation.
4. **Decide the offer** (below) and do not improvise per-customer.

Do not start until #2 passes. Asking for money and then failing at checkout
burns the lead permanently.

---

## The offer

These people signed up under "pay later" and were never billed. Charging them
retroactively is wrong and will lose them. The offer is forward-only:

> Your site is live and stays live. From {date}, it moves to a paid plan. As
> one of our first customers you keep your current price for as long as you
> stay subscribed, even when we raise it for new customers.

Rules:
- **Never** backdate charges
- **Never** threaten to delete their site — they will simply not reply
- Give a real date, 14 days out
- The Tier A group gets the strongest grandfathering; they did the most work

---

## Message sequence — Tier A (warm)

WhatsApp preferred, email fallback. One person, four touches maximum.

**Touch 1 — Day 0 (acknowledge our own gap)**

> Assalamu alaikum {name}, {your name} from Passive Coder.
>
> You set up {site name} with us back in {month} — I had a look, you've put real
> work into it.
>
> Being straight with you: we never actually set up billing on your account, so
> you've been running free this whole time. That was our mistake, not yours.
>
> Your site stays live either way. I wanted to check — is it working for you?
> Anything broken or missing?

No ask. Opens with our error and a genuine question. This gets replies.

**Touch 2 — Day 3 (the ask, after they respond)**

> Good to hear. Here's where things stand:
>
> From {date, 14 days out} accounts move onto paid plans. Because you were one
> of the first, you keep **{plan} at ${X}/month** and it stays at that price as
> long as you stay with us, even when we raise it for new customers.
>
> Nothing changes on your site. Want me to send the payment link?

**Touch 3 — Day 7 (objection or silence)**

If silent:
> Just checking you saw this — anything you want changed on the site before
> {date}? Happy to sort it out.

If price objection: use the objection handling in
[02-video-whatsapp-funnel-sop.md](02-video-whatsapp-funnel-sop.md) §6. Their
strongest counter is "it hasn't brought me customers yet" — see below.

**Touch 4 — Day 12 (clean close)**

> Should I keep your account open, or park it for now? Either is fine — just
> don't want to leave you guessing.

Then stop. Move to quarterly check-in.

### The objection you will actually get

> "It hasn't brought me any customers."

Do not argue. It is usually true, and often our fault:

> Fair. Can I look at it with you? Usually it's one of three things — the site
> isn't indexed, there's no clear way to contact you, or nobody knows it
> exists. Give me two days and I'll come back with what's actually wrong and
> fix it. Then decide.

Fix it, then ask again. This converts far better than a discount, and it is
the honest answer.

---

## Message sequence — Tier B (cold)

Single touch, then stop. Do not spend a sequence on these.

> Assalamu alaikum {name}, {your name} from Passive Coder.
>
> You started setting up {site name} with us in {month} but it looks like it
> never got finished. Do you still want it? If yes I'll help you get it done —
> if not, no problem, I'll close it off.

A reply moves them to the Tier A sequence. No reply after 7 days: mark dormant,
stop contacting. Do not run four touches at someone who never engaged.

---

## Use the follow-up engine

We built a follow-up and reactivation engine in ENM (2026-08-18) for exactly
this problem, and its endpoints verify clean as of 2026-09-02. We have never
run it on our own funnel.

Before relying on it for this campaign:
1. Confirm `CRON_SECRET` and `NEXT_PUBLIC_APP_URL` exist as GitHub secrets, or
   the hourly workflow 401s silently
2. Watch one real enrollment complete end to end
3. Keep attribution conservative — recovery is only credited when the engine
   actually sent a message before conversion

For the first 6 Tier A contacts, **do it by hand.** Six conversations is not
worth automating, and hand-running it teaches you what the sequence should say.

---

## Targets

Be realistic. From ~6 warm and ~11 cold:

| Outcome | Realistic | Good |
|---|---|---|
| Tier A replies | 4 of 6 | 6 of 6 |
| Tier A paid | 2 | 4 |
| Tier B revived | 1 | 3 |
| **Total new paying** | **3** | **7** |

At Pro monthly ($80), 3 conversions is $240/month recurring. That is not a
business yet — it is proof the payment path works end to end with real money,
which is the actual goal of this campaign.

---

## After the campaign

Record in `subscription_payments` (the campaign either produces rows there or
it did not work) and note:

- Which tier converted, and what the objection was
- Whether the "our mistake" opening worked
- Whether anyone raised the site-not-working objection, and what fixing it did

Then fix the systemic issue: **nothing should ever again reach `onboarded` with
no billing path.** The Dodo wiring (v1.0.160) addresses new signups; this
campaign clears the backlog.
