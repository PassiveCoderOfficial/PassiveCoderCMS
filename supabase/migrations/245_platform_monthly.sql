-- 245: Platform-only plan (2026-11-16). A site the client builds
-- themselves (no development paid) pays the platform monthly or yearly.
-- Yearly = the existing renewal price; monthly = about 20% more over a year
-- (BDT Pro 1,250). Websites we built keep renewing yearly only.
-- USD in cents, other currencies in whole units, like the other columns.
alter table public.plan_prices add column if not exists platform_monthly integer;

update public.plan_prices p set platform_monthly = v.m
from (values
  ('basic','USD',2000), ('pro','USD',3000), ('biz','USD',5000),
  ('basic','BDT',800),  ('pro','BDT',1250), ('biz','BDT',2000),
  ('basic','AED',75),   ('pro','AED',110),  ('biz','AED',180),
  ('basic','SAR',75),   ('pro','SAR',115),  ('biz','SAR',190),
  ('basic','QAR',75),   ('pro','QAR',110),  ('biz','QAR',180),
  ('basic','OMR',8),    ('pro','OMR',12),   ('biz','OMR',19),
  ('basic','SGD',26),   ('pro','SGD',39),   ('biz','SGD',65),
  ('basic','MYR',40),   ('pro','MYR',60),   ('biz','MYR',100)
) as v(plan_id, currency, m)
where p.plan_id = v.plan_id and p.currency = v.currency;
