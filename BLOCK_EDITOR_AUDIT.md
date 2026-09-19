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

### Phase 3 — Live Playwright verification
(pending)

## Shipped
(commits listed here as they land, with version numbers)
