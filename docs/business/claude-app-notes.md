# Claude app notes — business context

Decisions carried over from planning sessions in the Claude app, so Claude Code
sessions in this repo start from the same picture.

Last updated: 2026-10-10

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

## Pricing — DRAFT v2 (2026-10-10, agreed in principle, not yet public)

Supersedes the Bangladesh-channel tables that were here. Nothing below is on
the live site yet. Do not quote to customers until Wali marks it final.

### Model: three layers

1. **Development** — one-time build.
2. **Platform** — hosting, SSL, storage, backups, domain renewal, dashboard,
   CRM, booking. Development includes 12 months. Renewed **yearly only**
   (no monthly platform billing anywhere).
3. **Care** — people doing the work (changes, pages, support). Monthly or
   yearly. **Care includes the platform** for as long as it runs.

A site stays online while **either** the platform or Care is paid. Cancelling
Care falls back to the platform renewal; the site never disappears just
because Care ended.

### Currencies

- Public pricing is **USD** (passivecoder.com default, English).
- A section near the pricing asks "Bangladeshi? / বাংলাদেশ থেকে?" and leads
  to a dedicated Bangladesh landing page with **BDT** pricing.
- Bangla language switch shows BDT by default; English shows USD.
- USD price is ~3x the BDT price at 1 USD = 125 BDT, rounded to clean numbers.
  Bangladeshi expats abroad see USD publicly; deals happen in WhatsApp chat.

### Development (one-time)

| | Basic | Pro | Business |
|---|---|---|---|
| BDT | 12,000 | 25,000 | 50,000 |
| USD | 299 | 599 | 1,199 |
| Pages we build | 6 | 15 | 30 |
| Page limit on the site | none | none | none |
| Storage | 2 GB | 10 GB | 50 GB |
| Platform included | 12 months | 12 months | 12 months |
| Free Care | 3 months Care Basic | 3 months Care Pro | 12 months Care Pro |

Extra page built by us: BDT 1,000 / USD 29. Client-built pages are free.

### Platform renewal (yearly only, from year 2, only if no Care)

| | Basic | Pro | Business |
|---|---|---|---|
| BDT / year | 8,000 | 12,000 | 20,000 |
| USD / year | 199 | 299 | 499 |

Domain renewal is included in the platform fee and in every Care tier.

### Care

| | Care Basic | Care Pro | Care Business |
|---|---|---|---|
| BDT / month | 5,000 | 12,000 | 18,000 |
| BDT / year (8x, "৪ মাস ফ্রি") | 40,000 | 96,000 | 144,000 |
| USD / month | 129 | 299 | 449 |
| USD / year (8x) | 1,032 | 2,392 | 3,592 |
| Platform + hosting + SSL + backups + domain renewal | yes | yes | yes |
| Content/design changes per month | 3 | 10 | fair use |
| New pages per month | 0 | 2 | 5 |
| Response time | 48h | 24h | same day, dedicated WhatsApp |
| Monthly report | no | yes | yes + call |
| Search Console / schema / SEO checks | no | yes | yes |
| Blog posts written per month | 0 | 2 | 4 |
| Ad landing pages per month | 0 | 0 | 1 |

- Google Business Profile management is **not** offered on any tier.
- Search Console and SEO tooling exist on the platform for everyone, but
  hands-on support for them starts at Care Pro.
- Unused changes do not roll over.

**Fair use (Care Business, and the definition of "one change" for all tiers),
draft wording:**
- One change = one edit request on one page that takes up to 30 minutes
  (text, image, section reorder, colour, a form field). Bigger requests
  count as several changes or are quoted as a new page.
- Fair use = up to ~20 hours of team time per month. Above that we talk
  first, we never silently bill.
- Not included in any tier: a full redesign, new custom features or
  integrations, paid stock media, ad spend.

### Care without development

Allowed (existing Passive Coder sites, migrated WordPress sites). Care then
includes the platform for its term. Draft rule: a migrated site pays a
one-time onboarding/migration fee or commits to yearly Care; to be decided.

### How it is sold

- Care is offered as an **add-on at development checkout**, preselected to
  the matching tier, free months applied.
- **Bundle:** development + 1 year Care in one payment, ~10% off.
- A dedicated Care landing page (SEO slug TBD, e.g.
  `/website-maintenance` / `/website-care-plans`) for Care-only buyers.

### Superseded — do not quote

The monthly SaaS model (BDT 4,000 / 7,500 per month, BDT 32,000 / 60,000 per
year), the launch offer BDT 15,000 / 30,000 per year, the first one-time draft
(Care BDT 1,500 / 2,500 / 4,000), and the old landing page figures
(BDT 42,000 / 84,000).

### Watch

- Basic platform renewal (BDT 8,000) is 67% of the Basic build price; some
  clients will balk in year 2. Care Basic must look like the obvious upgrade.
- Existing monthly clients: migration path not decided.

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
