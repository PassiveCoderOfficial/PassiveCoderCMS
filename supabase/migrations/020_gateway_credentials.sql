-- 020_gateway_credentials.sql
-- Store Dodo and shurjoPay credentials (live + sandbox) in platform_settings
-- so SA can configure gateways from the dashboard without touching env vars.

begin;

alter table public.platform_settings
  -- Dodo live
  add column if not exists dodo_live_api_key                   text,
  add column if not exists dodo_live_webhook_secret            text,
  add column if not exists dodo_live_product_basic_yearly      text,
  add column if not exists dodo_live_product_pro_yearly        text,
  add column if not exists dodo_live_product_basic_monthly     text,
  add column if not exists dodo_live_product_pro_monthly       text,
  -- Dodo sandbox/test
  add column if not exists dodo_sandbox_api_key                text,
  add column if not exists dodo_sandbox_webhook_secret         text,
  add column if not exists dodo_sandbox_product_basic_yearly   text,
  add column if not exists dodo_sandbox_product_pro_yearly     text,
  add column if not exists dodo_sandbox_product_basic_monthly  text,
  add column if not exists dodo_sandbox_product_pro_monthly    text,
  -- shurjoPay live
  add column if not exists shurjopay_live_base_url             text,
  add column if not exists shurjopay_live_username             text,
  add column if not exists shurjopay_live_password             text,
  add column if not exists shurjopay_live_prefix               text,
  -- shurjoPay sandbox (override the built-in public sandbox defaults)
  add column if not exists shurjopay_sandbox_username          text,
  add column if not exists shurjopay_sandbox_password          text,
  add column if not exists shurjopay_sandbox_prefix            text;

commit;
