-- Module gating: SA defines which platform modules each plan includes and
-- their default on/off state; tenants toggle within what their plan permits.
-- Structured (per-module included/defaultOn), distinct from plans.features
-- which stays a freeform marketing-bullet list.
--
-- New column defaults to '{}' (nothing included) — correct for brand-new
-- plans an SA is actively configuring, but WRONG for plans that already have
-- live tenants: an empty modules map would hide every gated nav item
-- (Services, Ecommerce, Accounting, etc.) for existing customers overnight.
-- Every plan that exists at migration time is backfilled below to have every
-- current MODULE_KEYS entry included+defaultOn, preserving current behavior;
-- SA can then deliberately restrict plans going forward via the Plans admin UI.
ALTER TABLE plans ADD COLUMN IF NOT EXISTS modules jsonb NOT NULL DEFAULT '{}';

UPDATE plans SET modules = '{
  "services": {"included": true, "defaultOn": true},
  "features": {"included": true, "defaultOn": true},
  "portfolio": {"included": true, "defaultOn": true},
  "sliders": {"included": true, "defaultOn": true},
  "testimonials": {"included": true, "defaultOn": true},
  "pricing": {"included": true, "defaultOn": true},
  "bookings": {"included": true, "defaultOn": true},
  "ecommerce": {"included": true, "defaultOn": true},
  "crm": {"included": true, "defaultOn": true},
  "invoices": {"included": true, "defaultOn": true},
  "marketing": {"included": true, "defaultOn": true},
  "jobs": {"included": true, "defaultOn": true},
  "pos": {"included": true, "defaultOn": true},
  "inventory": {"included": true, "defaultOn": true},
  "accounting": {"included": true, "defaultOn": true}
}'::jsonb
WHERE modules = '{}'::jsonb;

-- Per-tenant override, clamped server-side to modules the plan includes.
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS enabled_modules jsonb NOT NULL DEFAULT '{}';
