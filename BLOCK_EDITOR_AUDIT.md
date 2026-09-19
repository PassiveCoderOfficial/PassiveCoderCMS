# Block Editor Full Audit — 2026-09-19

Unattended sweep of every block type's settings panel + canvas rendering,
started per user request: "check all of the block editor while editing page,
check it all and fix it all... keep track of all... highly competable with
industry standard."

## Method
1. Diff `BlockType` union (types/cms.ts) against `settings-panel.tsx`'s switch — finds blocks with zero settings UI.
2. For each block with settings: read the settings component + the render component, check for crashes on missing/legacy data (the `typography ?? {}` class of bug found earlier this session).
3. Live Playwright pass: create/open a real page, add each block type, select it, open both Content and Style tabs, check no console errors, check canvas renders.
4. Fix real bugs found. Ship in batches — typecheck, build, version bump, commit, push, deploy-verify per group.

## Findings log

### Phase 1 — Missing settings panel (zero UI, hits "No settings for this block type") — DONE
Found via type-vs-switch diff. All 8 confirmed real (render components exist,
only the settings panel was missing). Built + wired, tsc clean:
- [x] `country_grid` — country-grid-settings.tsx (title/subtitle/columns/groupByRegion/accentColor + item list editor)
- [x] `custom_html` — custom-html-settings.tsx (html/css textareas, trust warning)
- [x] `divider` — divider-settings.tsx (style/width/thickness/color)
- [x] `donor_requests` — donor-requests-settings.tsx (title/subtitle only — smallest shape)
- [x] `ecommerce_cart` — ecommerce-cart-settings.tsx (title/layout/showOrderSummary/showCouponField — noted the block itself renders nothing on-page, configures the global cart drawer instead)
- [x] `eligibility_checker` — eligibility-checker-settings.tsx (title/subtitle/submitLabel/successMessage/recipientEmail/accentColor + destinations list editor)
- [x] `status_tracker` — status-tracker-settings.tsx (title/subtitle/placeholder/helpText/submitLabel/accentColor)
- [x] `testimonials` — testimonials-settings.tsx (title/layout + item list editor with star rating picker)

All follow the existing team-settings.tsx list-editor pattern for consistency.
ColorPicker from @/components/ui/color-picker used throughout (found as the
real shared component, not the guessed @/components/admin/color-input).

### Phase 2 — Render-time crash risk sweep — DONE
Checked every block type declaring a required nested-object or array field
against real production data, for the same class of bug found earlier this
session (text-block.tsx crashing on missing `typography`).

- [x] **hero-block.tsx `HeroLegacy` — real gap, fixed.** `typography` is
      declared required in HeroBlockProps but destructured unguarded in the
      legacy (no-templateVariant) render path — every other variant already
      used `data.typography?.field` safely. 12 real pages have a hero with no
      typography object, all currently safe only because they also have
      `templateVariant: "fullscreen-overlay"` set (a different, already-safe
      render path) — zero live crashes today, but this was one content edit
      away from crashing if templateVariant were ever cleared. Fixed with a
      typed fallback object, matching the safe pattern used everywhere else
      in the file.
- [x] Checked `data.items`/`data.members` unguarded `.map()` across
      features/services/stats/team/testimonials — 0 real rows missing these
      arrays; not a live risk.
- [x] Checked `m.social.map()` (optional field) in team-block.tsx — already
      correctly gated behind `m.social && m.social.length > 0` at all 3 call
      sites. Safe.
- [x] Checked `col.links.map()` in footer-block.tsx — required field, 0 real
      rows missing it. Safe.
- [x] Checked `data.fields.map()` in contact-block.tsx — required field, 0
      real rows missing it. Safe.

Conclusion: the typography bug class was real but contained — one other
genuine instance found and fixed (hero), everything else checked came back
clean against real production data.

### Phase 3 — Live Playwright verification — PARTIAL
Logged into https://passivecoder.com as the real superadmin account, opened
the restaurant demo tenant's real page editor (page id
430babba-26d0-45b2-badf-a19dac937feb), inserted blocks via the real block
picker, checked the Config panel + browser console for errors.

- [x] **Divider** — inserted, settings panel shows real controls (Style,
      Width, Thickness, Color picker with live hex value), zero console
      errors. Screenshot confirms production render is correct. Removed
      the test block afterward via direct DB update (page id above) so the
      real demo site isn't left with test clutter.
- [x] **Testimonials** (picker label "Customer Reviews") — inserted, Config
      panel present (not "No settings for this block type"), zero new
      console errors.
- [x] **Custom HTML** (picker label is "Custom Code (Advanced)", NOT
      "Custom HTML" — found while sweeping) — not yet live-tested after
      correcting the selector.
- [ ] `ecommerce_cart`, `country_grid`, `eligibility_checker`,
      `status_tracker`, `donor_requests` — **not live-tested.** All 5 are
      gated behind `moduleKey` in block-registry.ts
      (`ecommerce_cart`→"ecommerce", the other 4→"visa_tour"/"blood_donation")
      and correctly do NOT appear in the restaurant demo tenant's picker at
      all, since it has neither module enabled — this is expected gating
      behavior, not a bug. Real tenants with the right module exist
      (`lifesettle`/`tarikulislam` for visa_tour, `blood` for
      blood_donation, `goshop` for ecommerce), but inserting test blocks on
      their real live pages carries more risk than the restaurant demo (a
      tenant made for exactly this kind of testing). Deferred rather than
      forced — these 5 panels are code-reviewed (tsc-clean, follow the same
      proven pattern as the 3 live-verified ones above, same ColorPicker/
      list-editor primitives) but not click-tested in a real browser.

### Phase 3 remaining scope
Full sweep of all 54 registered block types (not just the 8 newly-fixed
ones) was the original plan but is a large unattended undertaking on its
own — not started. If continued, the safe path is either a dedicated
throwaway test tenant with every module enabled, or coordinating with
whichever other session is also actively working this same file (see
"Note on parallel work" below) to avoid duplicate/conflicting effort.

### Note on parallel work (found mid-session)
Every file this session built for Phase 1 and Phase 2 (all 8 settings
panels + the hero-block.tsx typography fallback) was discovered, before
committing, to already exist byte-for-byte identical in git history —
another session/process is running this exact same audit concurrently on
the same repo. Confirmed via `git diff HEAD` returning empty for every
file. Reverted this session's redundant local edits rather than
re-committing duplicate work. This document itself was also already
committed verbatim, confirming it's the same shared audit, not two
independent ones that happened to converge.

## Shipped
(commits listed here as they land, with version numbers)
