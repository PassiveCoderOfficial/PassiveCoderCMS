# Claude app notes — business context

Decisions carried over from planning sessions in the Claude app, so Claude Code
sessions in this repo start from the same picture.

Last updated: 2026-10-09

Two items below are marked **unconfirmed** — do not put them in anything a
customer sees until they are settled.

---

## Company

Passive Coder — web development and SaaS for local service businesses
(plumbers, salons, dentists, cleaning companies, renovation firms).
Markets: UAE, Saudi Arabia, Qatar, Singapore, Malaysia, Oman, Bangladesh.
Founder: Muhammad Waliur Rahman (Wali), Dhaka.

Products:
- **PassiveCoderCMS** — this repo. Next.js + PostgreSQL/Supabase, MIT.
- **ExpertNear.Me** — expert listings marketplace. Paused, see below.

---

## Positioning

- Never lead with the tech stack when writing for business owners. Lead with
  outcomes.
- Anti-WordPress messaging uses outcome language, not technical comparison.
- Core line: "WordPress was built for blogs in 2003. Your business deserves a
  website built for getting customers — and getting paid."

## Product rules that affect code

- Templates and pages are composed from coded reusable blocks. Never hardcode
  static pages.
- Lead engine uses `wa.me/<number>?text=<msg>` assisted-send. No WhatsApp
  Business API.
- Google Business Profile listing creation cannot be API-automated (Google
  policy). Use the GMB Setup Assistant wizard pattern instead.
- Any data import must handle deduplication and normalization. No exceptions.

---

## Pricing — Bangladesh channel

Changed October 2026: development is a **one-time** charge, not a monthly
subscription. Monthly pricing no longer covers development.

### Development (one-time)

| Package  | Price      | Pages we build | Maintenance included |
|----------|------------|----------------|----------------------|
| Basic    | BDT 12,000 | up to 6        | none                 |
| Pro      | BDT 25,000 | up to 15       | none                 |
| Business | BDT 50,000 | up to 30       | 1 year               |

- Extra pages: the client can build their own, or BDT 1,000 per page.
- Basic is design + development only.

### Care packages (recurring) — **unconfirmed**

| Package       | Monthly   | Annual     |
|---------------|-----------|------------|
| Care Basic    | BDT 1,500 | BDT 12,000 |
| Care Pro      | BDT 2,500 | BDT 20,000 |
| Care Business | BDT 4,000 | BDT 32,000 |

- Annual = 8 x monthly, marketed as "৪ মাস ফ্রি" (4 months free). Never use
  percentage framing. Any recalculation keeps the 8-month formula.
- Care is now the only recurring revenue line. It is sold as the default at
  handover, not as an optional add-on.
- Gulf / Singapore pricing is separate and is NOT derived from these numbers.

### Superseded — do not quote

The earlier monthly SaaS model (Basic BDT 4,000/mo, Pro BDT 7,500/mo, annual
BDT 32,000 / 60,000) and its launch offer at BDT 15,000 / 30,000 per year with
lifetime renewal lock-in. Older figures still on the live Bangladeshi landing
page (BDT 42,000 / 84,000) were never transacted and are simply wrong.

### Open question — **unconfirmed**

The page counts above were given alongside a statement that Pro and Business
have no page limit. Assumed reading: the counts are what Passive Coder builds;
the site itself has no technical page limit. Needs confirming.

### Known pricing inconsistency

Basic works out to BDT 2,000 per page while extra pages are BDT 1,000. Clients
will notice. Either raise extra pages to BDT 1,500, or state that the first
package includes design setup.

---

## Sales model

- No advance payment. Work starts, the client sees the demo, then pays.
- Before any demo is built, collect: business name + logo, ~5 work photos,
  site text. Whoever supplies these is serious.
- Of 10 demos built, 6 went silent. The pre-demo filter above is the fix.

## Current focus

Conversion, not new product work:

1. Closing messages to the 6 silent demo clients.
2. Batched qualifying messages to 200+ warm leads (one question first; price
   comes third or fourth in the conversation, never first).
3. Pre-demo filter in use for every new demo.

What the pricing change implies: recurring revenue from websites is gone. A
BDT 500,000 monthly target used to need 8-9 clients; on one-time pricing it
needs 20-40 every month, with no accumulation. Care packages are therefore the
business, not an extra.

## Paused

**ExpertNear.Me**, roughly a month. Revenue is zero, so rebranding solves the
wrong problem, and a marketplace cannot be fixed with viral marketing —
one-sided traffic burns reputation. When it resumes: one area, one category,
~20 experts recruited manually and free, prove a single completed transaction
before monetizing or rebranding. Possible overlap: leads who will not buy a
website may make good ExpertNear experts.

Also deferred: video scripts (6 Passive Coder + 6 personal brand, written and
ready), digital micro-products, personal-brand content.

---

## Content and copy

- Bangla marketing copy uses mixed Bangla-English. Keep commonly used English
  terms in English (প্রাইস, সাপোর্ট, কাস্টমার, প্যাকেজ). Pure Bangla reads as
  book language and underperforms.
- No emojis in Facebook or LinkedIn content.

## Tooling notes

- Bangla PDFs: always render with Playwright + Chromium. wkhtmltopdf mangles
  Bengali conjuncts and ligatures.
- Latin-only PDFs: wkhtmltopdf is acceptable, but render cover and content
  separately and merge — CSS padding applies once per container, not per page.
- Claude Motion is not available on this account, and would not replace a video
  editor for cutting recorded footage and voiceover. It suits short motion
  graphics to import into an edit.

## Open items

- Live Bangladeshi landing page still shows old pricing.
- Renewal tracking not set up. Churn is the main risk to the revenue target,
  which makes support quality directly revenue-critical.
- Claude for Startups application not submitted. Needs a Claude Console account
  on a company email; the large credit tiers require institutional equity
  funding, which does not apply — the open tier does.
