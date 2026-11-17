-- 242: "selfhost" plan for the standalone (self-hosted, single-site) edition.
--
-- A self-hosted install's one site gets plan = 'selfhost' from /setup, so
-- lib/modules/resolve-modules.ts turns on the open (AGPL core) modules and
-- leaves the premium ones off. is_active = false keeps the row out of every
-- public pricing list and plan picker on the hosted platform; on the hosted
-- database it is one unused row.
--
-- Open modules: services, features, portfolio, sliders, testimonials, pricing,
-- bookings, ecommerce (single vendor), crm, invoices, marketing, collections,
-- ai_coder, ai_agent. Everything else is premium (included = false).

insert into public.plans (id, name, price_yearly, storage_gb, is_active, sort_order, pages_limit, modules, features)
values (
  'selfhost',
  'Self-hosted',
  0,
  0,
  false,
  99,
  -1,
  '{
    "services":          {"included": true,  "defaultOn": true},
    "features":          {"included": true,  "defaultOn": true},
    "portfolio":         {"included": true,  "defaultOn": true},
    "sliders":           {"included": true,  "defaultOn": true},
    "testimonials":      {"included": true,  "defaultOn": true},
    "pricing":           {"included": true,  "defaultOn": true},
    "bookings":          {"included": true,  "defaultOn": true},
    "ecommerce":         {"included": true,  "defaultOn": false},
    "crm":               {"included": true,  "defaultOn": true},
    "invoices":          {"included": true,  "defaultOn": true},
    "marketing":         {"included": true,  "defaultOn": false},
    "collections":       {"included": true,  "defaultOn": false},
    "ai_coder":          {"included": true,  "defaultOn": true},
    "ai_agent":          {"included": true,  "defaultOn": true},
    "jobs":              {"included": false, "defaultOn": false},
    "pos":               {"included": false, "defaultOn": false},
    "inventory":         {"included": false, "defaultOn": false},
    "accounting":        {"included": false, "defaultOn": false},
    "visa_tour":         {"included": false, "defaultOn": false},
    "blood_donation":    {"included": false, "defaultOn": false},
    "marketplace":       {"included": false, "defaultOn": false},
    "content_scheduler": {"included": false, "defaultOn": false},
    "real_estate":       {"included": false, "defaultOn": false},
    "results":           {"included": false, "defaultOn": false},
    "restaurant":        {"included": false, "defaultOn": false},
    "projects":          {"included": false, "defaultOn": false}
  }'::jsonb,
  '[]'::jsonb
)
on conflict (id) do nothing;