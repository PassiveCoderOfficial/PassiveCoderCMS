-- Restaurant vertical Tier 3, item #2 (docs/business/06-restaurant-vertical.md):
-- live rider GPS. Deliberately the simplest useful shape — last-known
-- position + timestamp, not a location history/trail. The rider PWA
-- (/rider/[token]) posts its browser Geolocation reading periodically
-- while it has an active delivery; staff see "last seen 40s ago, here" as
-- a plain map link, not an embedded live-tracking map widget (no maps SDK
-- dependency pulled in for this).

alter table public.restaurant_riders
  add column if not exists last_lat double precision,
  add column if not exists last_lng double precision,
  add column if not exists last_location_at timestamptz;

comment on column public.restaurant_riders.last_lat is
  'Rider''s last-known latitude, posted by the rider PWA while it has an active delivery. Null until the rider has ever shared a location.';
comment on column public.restaurant_riders.last_lng is
  'Rider''s last-known longitude — see last_lat.';
comment on column public.restaurant_riders.last_location_at is
  'When last_lat/last_lng were captured. Staff should treat a stale timestamp (the rider''s phone went to sleep, lost signal, or closed the tab) as "unknown" rather than trusting an old pin.';
