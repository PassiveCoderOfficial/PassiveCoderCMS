-- 011_billing_payment_config.sql
-- Manual payment (bKash / Nagad / bank transfer) instructions shown to clients
-- at checkout, configured by the super admin. Stored on the singleton
-- platform_settings row (id = 1).

begin;

alter table public.platform_settings add column if not exists bkash_number text;
alter table public.platform_settings add column if not exists nagad_number text;
alter table public.platform_settings add column if not exists bank_details text;
alter table public.platform_settings add column if not exists manual_payment_instructions text;

insert into public.platform_settings (id)
values (1)
on conflict (id) do nothing;

commit;
