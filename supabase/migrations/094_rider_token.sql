-- Restaurant vertical Phase 6 (docs/business/06-restaurant-vertical.md):
-- rider PWA. Riders deliberately have no auth.users account (090's own
-- comment: "usually a name and a phone number, not someone who logs into
-- the dashboard") — so a real login screen is the wrong shape here. Same
-- pattern as restaurant_tables.qr_token: an unguessable per-rider token in
-- the URL is the whole access control, no password, shareable over
-- WhatsApp/SMS the same way a rider gets told their shift already.

alter table public.restaurant_riders
  add column if not exists rider_token uuid not null default gen_random_uuid();

create unique index if not exists restaurant_riders_token_idx
  on public.restaurant_riders (rider_token);

comment on column public.restaurant_riders.rider_token is
  'Unguessable per-rider link token for the rider PWA (/rider/[token]) — the entire access control, matching restaurant_tables.qr_token. No login: whoever holds the link can see and advance that rider''s currently-assigned deliveries.';
