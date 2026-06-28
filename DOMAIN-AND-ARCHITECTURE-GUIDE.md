# PassiveCoder CMS — Architecture & Domain Automation Guide

## 1. How the site is structured (the "how the hell" answer)

Not "only CSS". Full stack:

- **Framework**: Next.js 16 (App Router, React Server Components) + TypeScript.
- **Styling**: Tailwind CSS. Template palette → CSS variables injected at `:root`
  (`src/modules/themes/template-css.ts`). No per-site CSS files.
- **Data**: Supabase (Postgres). Each page = a row in `pages` with a `blocks` JSONB
  column — an ordered array of typed block objects.
- **Rendering**: `src/components/site/page-renderer.tsx` maps each block `type` to a
  React component in `src/components/blocks/<name>/`.
- **Multi-tenant**: one codebase serves every client site. The tenant is resolved from
  the request host (`src/lib/tenant/resolve.ts`) → `x-tenant-id` header → all queries
  filter by `tenant_id`.
- **Global header/footer**: stored in `site_identity.global_header` / `global_footer`
  (single block objects), injected by `(site)/layout.tsx` (and `(marketing)/page.tsx`
  for the root `/`).

So the mega-menu, footer, bullets — all React components reading DB content, styled
with Tailwind. Editing content = DB; editing layout/behavior = component code.

## 2. Mega-menu as a permanent CMS feature

Today the multi-level mega-menu is **already generic** in `navigation-block.tsx`:
- A nav item with `children` → dropdown.
- A nav item whose `children` themselves have `children` → auto-renders a **mega-menu**
  (region columns via CSS multi-column, standalone links as a top row).

This works for ANY site, driven purely by the nav data in `site_identity.global_header`.
The data is editable in the dashboard at **Identity & Navigation → Global Nav** (add
items, sub-items; nesting one more level produces the mega-menu).

### Recommended follow-up (to make it first-class)
The admin nav editor currently supports 2 levels well; 3-level (mega groups) is editable
via seed/JSON but the UI is fiddly. Build:
- A "Mega menu" toggle per top-level nav item in the Global Nav editor.
- A 3rd-level "group → links" editor when that toggle is on.
- Optional: a "link source" picker (e.g. "auto-list all country pages by region") so the
  menu stays in sync as pages are added — no manual relisting.

## 3. Domain automation — current state

**Good news: it's already built.** End-to-end pieces:

| Piece | File | Purpose |
|---|---|---|
| Registrar (buy/search) | `src/lib/domain/logicbox.ts` | LogicBox/ResellerClub HTTP API: search, register, contacts, DNS records, nameservers |
| DNS helpers | `src/lib/domain/dns.ts` | A-record/nameserver instructions, auto DNS setup, propagation check via Google DNS |
| Vercel binding | `src/lib/domain/vercel.ts` | Add/remove/verify a custom domain on the Vercel project |
| API routes | `src/app/api/domain/{search,purchase,connect,verify}/route.ts` | Wire the above to the dashboard |
| Dashboard UI | `src/app/(admin)/dashboard/settings/domain/` | Client connects/verifies a domain |
| Host→tenant routing | `src/lib/tenant/resolve.ts` | Maps `custom_domain` → tenant (already handles apex custom domains) |
| DB | `tenants.custom_domain`, `tenants.domain_status`, `domain_orders` | State tracking |

### Required env vars (set in Vercel project settings)
```
VERCEL_API_TOKEN     # Vercel personal/team token with project access
VERCEL_PROJECT_ID    # this project's id
VERCEL_TEAM_ID       # if the project is under a team
VERCEL_IP=76.76.21.21        # Vercel anycast A-record target (default ok)
LOGICBOX_USER_ID     # registrar reseller account
LOGICBOX_API_KEY
NEXT_PUBLIC_ROOT_DOMAIN=passivecoder.com
```

## 4. Connecting lifesettlevisa.com (the domain you bought)

Two scenarios:

### A) You registered it ELSEWHERE (e.g. Namecheap/GoDaddy) — "connect" flow
1. Dashboard → Settings → Domain → enter `lifesettlevisa.com`, choose **A-record**.
2. The app calls `addDomainToVercel()` and shows DNS instructions.
3. At your registrar's DNS, add:
   - `A    @    76.76.21.21`
   - `CNAME www  cname.vercel-dns.com`
4. Click **Verify** — the app checks Vercel + Google DNS, flips `domain_status=active`.
5. `resolve.ts` then maps the host to the Life Settle tenant automatically. SSL is
   auto-issued by Vercel.

Fastest fully-automated variant: choose **Nameserver** instead, point the domain's NS to
`ns1..5.logicbox.net`; then `setupAutomaticDns()` writes the A records for you — zero
manual DNS at the registrar.

### B) You want PassiveCoder to SELL/REGISTER domains for clients — "purchase" flow
`/api/domain/purchase` + LogicBox `registerDomain()` already buys the domain under your
reseller account, sets your nameservers, and `setupAutomaticDns()` points it at Vercel —
the client never touches DNS. This is the fully-automated path for future sites.

## 5. DNS hosting — your options

1. **Registrar-managed DNS (simplest, manual)** — client keeps DNS at whoever they
   bought from; they paste the A/CNAME once. No infra for you. Good for one-offs.
2. **LogicBox/ResellerClub nameservers (recommended, automated)** — you already integrate
   this. Point domains to `ns1..5.logicbox.net`; the CMS writes DNS records via API. Best
   when PassiveCoder registers domains for clients. Becomes your DNS host.
3. **Cloudflare DNS via API (most control/perf)** — not built yet. Move zones to
   Cloudflare, create records via Cloudflare API, get fast global DNS, proxying, WAF,
   analytics. Worth building if you scale to many sites or want CDN/security features.
4. **Vercel DNS** — if a domain's nameservers point to Vercel, Vercel hosts DNS and
   binding is automatic. Simplest for Vercel-only, but ties DNS to Vercel.

### Recommendation
- **Now (lifesettlevisa.com)**: use **A-record connect** (scenario A) — 2 records, verify,
  done. Already supported in the dashboard.
- **For scale**: standardize on **LogicBox nameservers** (option 2) so every future site
  is one-click register → auto-DNS → auto-Vercel → live. Already coded; just needs the
  env vars + a smoke test.
- **Optional upgrade**: add a **Cloudflare DNS provider** module behind the same
  `dns.ts` interface for performance/security once volume justifies it.

## 6. What to build next (domain side)
- Verify the LogicBox + Vercel env vars are set in production and run one real
  purchase+connect to confirm the automated path.
- Add a background job/cron to poll `domain_status=pending` orders and auto-verify
  (so clients don't have to click Verify).
- Optional Cloudflare provider + a registrar-agnostic DNS interface.
- Surface domain status + SSL state in the dashboard with clearer guidance.
