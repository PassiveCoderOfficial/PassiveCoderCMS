-- 021_plan_bdt_prices.sql
-- Fixed BDT prices per plan (not USD×rate conversion).
-- USD prices stay in price_monthly / price_yearly (cents).
-- BDT prices stored as whole taka in price_monthly_bdt / price_yearly_bdt.
-- shurjoPay charges BDT; Dodo charges USD.

begin;

alter table public.plans
  add column if not exists price_monthly_bdt integer,
  add column if not exists price_yearly_bdt integer;

update public.plans set price_monthly_bdt = 5000,  price_yearly_bdt = 30000 where id = 'basic';
update public.plans set price_monthly_bdt = 10000, price_yearly_bdt = 60000 where id = 'pro';

commit;
