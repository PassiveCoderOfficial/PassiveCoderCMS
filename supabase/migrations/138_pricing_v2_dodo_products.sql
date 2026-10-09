-- Dodo product ids for pricing v2 items. Dodo has no ad-hoc amounts, so each
-- sellable item needs a product created on Dodo's dashboard; SA pastes the
-- ids here (same pattern as aicoder_packages). No id = card checkout for that
-- item is unavailable; bKash/Nagad/bank/shurjoPay still work.
alter table plans      add column if not exists dodo_dev_product_id              text;
alter table plans      add column if not exists dodo_dev_product_id_sandbox      text;
alter table plans      add column if not exists dodo_renewal_product_id          text;
alter table plans      add column if not exists dodo_renewal_product_id_sandbox  text;
alter table care_plans add column if not exists dodo_monthly_product_id          text;
alter table care_plans add column if not exists dodo_monthly_product_id_sandbox  text;
alter table care_plans add column if not exists dodo_yearly_product_id           text;
alter table care_plans add column if not exists dodo_yearly_product_id_sandbox   text;
