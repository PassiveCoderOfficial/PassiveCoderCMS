-- 019_payment_gateway_config.sql
-- Payment gateway mode and WhatsApp number, configurable from SA dashboard.
-- shurjopay_mode / dodo_mode: 'sandbox' | 'live'
-- whatsapp_number: stored here so SA can change without redeploy

begin;

alter table public.platform_settings
  add column if not exists shurjopay_mode   text not null default 'sandbox'
    check (shurjopay_mode in ('sandbox', 'live')),
  add column if not exists dodo_mode        text not null default 'live'
    check (dodo_mode in ('sandbox', 'live')),
  add column if not exists whatsapp_number  text,
  add column if not exists usd_to_bdt_rate  numeric(10,4) default 125;

-- seed defaults (idempotent)
insert into public.platform_settings (id)
values (1)
on conflict (id) do nothing;

commit;
