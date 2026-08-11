-- Multi-vendor ecommerce: extend the shared vendors table.
--
-- vendors is deliberately reused across BOTH marketplace modules (service
-- booking and ecommerce) rather than forked: approval flow, commission_rate,
-- user_id auth link and suspension are identical for both, and the
-- booking-specific data already lives in child tables (vendor_availability,
-- vendor_booking_settings) rather than on vendors itself. `capabilities`
-- is what separates them at query time.

alter table public.vendors
  add column if not exists capabilities   text[] not null default '{}',
  add column if not exists slug           text,
  add column if not exists logo           text,
  add column if not exists banner         text,
  add column if not exists description    text,
  add column if not exists trade_license  text,
  add column if not exists nid_number     text,
  add column if not exists bank_account   jsonb  not null default '{}',
  add column if not exists bkash_number   text,
  add column if not exists payout_hold_days int  not null default 7,
  add column if not exists rating         numeric(3,2) not null default 0,
  add column if not exists rating_count   int    not null default 0,
  add column if not exists pickup_address text,
  add column if not exists pickup_area    text;

-- Existing rows all predate ecommerce, so they are booking vendors.
update public.vendors
   set capabilities = array['booking']
 where capabilities = '{}';

-- Vendor storefront URLs are /vendor/<slug>, unique per tenant only —
-- two different tenants may each have a "rahim-store".
create unique index if not exists vendors_tenant_slug_key
  on public.vendors (tenant_id, slug) where slug is not null;

create index if not exists vendors_capabilities_idx
  on public.vendors using gin (capabilities);

create index if not exists vendors_user_id_idx
  on public.vendors (user_id) where user_id is not null;

-- ─── Vendor identity helpers (used by RLS across the ecom tables) ──────
-- SECURITY DEFINER so a vendor can be authorised against rows they can't
-- yet select; STABLE so Postgres caches per statement.

create or replace function public.current_vendor_id(t uuid)
returns uuid
language sql stable security definer set search_path = public
as $$
  select id from public.vendors
   where tenant_id = t and user_id = auth.uid() and status = 'approved'
   limit 1;
$$;

create or replace function public.owns_vendor(v uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.vendors
     where id = v and user_id = auth.uid() and status = 'approved'
  );
$$;

revoke execute on function public.current_vendor_id(uuid) from public;
revoke execute on function public.owns_vendor(uuid) from public;
grant execute on function public.current_vendor_id(uuid) to authenticated;
grant execute on function public.owns_vendor(uuid) to authenticated;
