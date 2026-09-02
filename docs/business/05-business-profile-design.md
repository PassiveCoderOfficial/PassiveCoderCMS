# Design — Business Profile & ENM Provisioning

Status: **design, not built.** Written 2026-09-02 for review before implementation.

---

## The idea

Capture each tenant's business details once, after signup, and feed three
consumers from that one record:

1. **AI content generation** — the AiCoder brief
2. **The website itself** — contact blocks, service lists, about page, schema.org
3. **The ExpertNear.Me profile** — created when the owner opts in

Today none of this is stored. The AI brief is retyped per run, contact details
are hand-entered per block, and ENM provisioning creates an account with an
email and nothing else.

---

## What already exists (do not rebuild)

**`businessFactsSchema`** in `src/lib/aicoder/brief.ts` is already almost
exactly the field list we want, and the generator already consumes it:

```
businessName, primaryService, services[], location, audience, goal, tone,
contact { phone, email, whatsapp, address },
forbiddenClaims[], neverMention[], designDirection,
provenNumbers[], hasRealTestimonials, hasRealTeam, hasRealPricing
```

Note the shape of the last group — these are **anti-hallucination gates**. The
planner will not schedule a testimonials block unless `hasRealTestimonials` is
true. That design is load-bearing and the wizard must preserve it: a field left
blank has to stay blank, never be filled with a plausible guess.

**ENM's `Expert` model** maps onto the same data:

| Business profile | ENM `Expert` |
|---|---|
| businessName | `businessName`, `name` |
| primaryService | `serviceTitle` |
| services[] | `Service[]` relation |
| location / serviceArea | `officeAddress`, `countryCode`, `mapLocation` |
| phone / whatsapp / email | `phone`, `whatsapp`, `email` |
| yearsOperating | `yearsOfExperience` |
| customersServed | `clientsServed` |
| about | `bio`, `shortDesc` |
| website | `webAddress` |

---

## Blocker: ENM cannot receive this yet

`POST /api/partner/provision` accepts only `{ email, name, pcTenantId, tier }`
and creates a **`User` with role `BUYER`**. It does not create an `Expert`
record at all.

So "populate the ENM fields" is not a matter of sending more fields to the
existing endpoint. ENM needs either:

- **(a)** an extended `partner/provision` that also upserts an `Expert`, or
- **(b)** a new `POST /api/partner/expert` for profile data, called after provisioning

**Recommendation: (b).** Provisioning an account and publishing a directory
profile are different actions with different failure modes, and the owner may
want an account without a public listing. Keeping them separate also means a
profile update from the CMS does not risk touching auth state.

`src/app/api/experts/onboard/route.ts` already has the create/upgrade logic to
copy, including the founding-expert placeholder merge.

---

## Proposed schema (CMS side)

One row per tenant, `tenant_business_profiles`:

```
tenant_id            uuid pk references tenants(id)
business_name        text
primary_service      text
services             jsonb   -- string[]
owner_name           text
years_operating      int
customers_served     int
projects_completed   int
service_areas        jsonb   -- string[]
phone                text
whatsapp             text
email                text
office_address       text
country_code         text
about                text
completed_at         timestamptz   -- null until the owner finishes
updated_at           timestamptz
```

RLS: `is_tenant_editor(tenant_id)`, matching the existing tenant tables.

Deliberately **not** stored here: `forbiddenClaims`, `neverMention`, `tone`,
`designDirection`. Those are per-generation-run creative direction, not facts
about the business, and belong in the AiCoder brief where they already live.

---

## Where it appears

**Not at signup.** Decided 2026-09-02: signup stays fast, and only WhatsApp was
added (now required). Every extra field at signup costs conversion at the exact
step we just repaired.

**Dashboard task card**, shown until `completed_at` is set:

> **Complete your business profile** — takes 3 minutes
> We use this to write your website content and to create your ExpertNear.Me
> listing. Nothing is published without you.

Three short steps rather than one long form:

1. **Business** — name, primary service, service list, years operating
2. **Contact** — phone, WhatsApp, email, office address, service areas
3. **Track record** *(optional, and clearly marked so)* — customers served,
   projects completed

Step 3 is optional because those numbers feed `provenNumbers`, and a guessed
figure becomes a public claim we cannot defend. Blank is safe; invented is not.

---

## How each consumer uses it

**AiCoder** — prefill `businessFactsSchema` from the profile instead of asking
again. The gate fields stay computed, not stored: `hasRealPricing` is true only
when real prices were supplied for that run.

**The website** — contact blocks, service lists and the about page read the
profile as defaults, so a tenant who fills this in once stops retyping their
phone number into every block.

**ENM** — the opt-in card (`ENMOptInCard`, shipped in v1.0.162) currently calls
`/api/enm/sso`, which provisions an account only. Once the ENM endpoint above
exists, the card posts the profile with it, and the resulting listing is
populated rather than an empty shell.

Sequencing note: the ENM opt-in should require `completed_at`. An empty
directory listing is worse than no listing — it is a public page that makes the
business look abandoned.

---

## Build order

1. `tenant_business_profiles` table + RLS (CMS)
2. Dashboard wizard + task card (CMS)
3. Prefill AiCoder brief from the profile (CMS)
4. `POST /api/partner/expert` (ENM)
5. Wire the opt-in card to send the profile, and gate it on `completed_at` (both)

Steps 1–3 deliver value on their own and do not depend on ENM. Step 4 is the
only piece needing work in the other repo.

---

## Open questions

- **Categories.** ENM `Expert` requires category links for the listing to appear
  in browse. The CMS has no equivalent taxonomy — does the wizard ask, or do we
  map from `primary_service`? Mapping will be wrong often enough to matter.
- **Who owns the truth after divergence?** If an owner edits their profile on
  ENM directly, does a CMS update overwrite it? Booking sync already
  established "PC owns the booking, ENM owns follow-up"; this needs the same
  kind of rule stated before we build it.
- **Profile completeness on public pages.** Should a half-filled profile render
  a thin site, or should the site fall back to template copy until complete?
