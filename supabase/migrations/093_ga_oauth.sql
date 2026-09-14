-- Google Analytics OAuth connect (supersedes the "no OAuth, no Reporting API
-- pull" design note in 081_page_analytics.sql — Wali decided 2026-09-14 that
-- a real "Connect Google Analytics" button belongs on the Analytics page,
-- pulling live GA4 report data via the Analytics Data API rather than only
-- ever writing a Measurement ID onto the tenant's own site).
--
-- Tokens are per-tenant, stored on site_settings alongside the existing
-- ga_measurement_id column rather than a new table — this is one more
-- optional field on the same "how this tenant's site talks to GA" surface,
-- not a separate concern.
--
-- refresh_token is the durable credential (Google access tokens expire in
-- ~1hr); access_token + expires_at are cached so a report fetch doesn't
-- have to round-trip Google's token endpoint on every request. property_id
-- is the GA4 property the tenant picks after connecting (one Google account
-- can have several), asked for once post-OAuth rather than guessed.
alter table public.site_settings
  add column if not exists ga_oauth_refresh_token text,
  add column if not exists ga_oauth_access_token text,
  add column if not exists ga_oauth_expires_at timestamptz,
  add column if not exists ga_property_id text,
  add column if not exists ga_oauth_connected_email text;

comment on column public.site_settings.ga_oauth_refresh_token is
  'Google OAuth refresh token (analytics.readonly scope). Never sent to the client — server-only, used to mint access tokens for GA4 Data API report calls.';
comment on column public.site_settings.ga_oauth_access_token is
  'Cached short-lived Google access token; refreshed via ga_oauth_refresh_token when expires_at has passed.';
comment on column public.site_settings.ga_property_id is
  'GA4 property id (numeric, e.g. "properties/123456789") the tenant selected after connecting — required before any report can be pulled.';
comment on column public.site_settings.ga_oauth_connected_email is
  'Google account email the OAuth grant came from, shown on the Analytics page so the tenant recognizes which account is connected.';
