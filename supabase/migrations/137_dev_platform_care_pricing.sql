-- Pricing model v2 (2026-10-10): one-time development, yearly platform,
-- monthly/yearly Care. A site stays online while EITHER the platform or Care
-- is paid; Care includes the platform. See docs/business/claude-app-notes.md.
--
-- Money: *_usd_cents are USD cents, *_bdt are whole taka (same convention as
-- the existing plans.price_* / price_*_bdt columns).

-- ── Development packages live on the existing plans rows (basic/pro/biz) ──
alter table plans add column if not exists dev_price_usd_cents      integer;
alter table plans add column if not exists dev_price_bdt            integer;
alter table plans add column if not exists renewal_yearly_usd_cents integer;
alter table plans add column if not exists renewal_yearly_bdt       integer;
alter table plans add column if not exists pages_built              integer;
alter table plans add column if not exists extra_page_usd_cents     integer;
alter table plans add column if not exists extra_page_bdt           integer;
alter table plans add column if not exists free_care_plan_id        text;
alter table plans add column if not exists free_care_months         integer;

update plans set dev_price_usd_cents = 29900,  dev_price_bdt = 12000, renewal_yearly_usd_cents = 19900, renewal_yearly_bdt = 8000,
  pages_built = 6,  storage_gb = 2,  extra_page_usd_cents = 2900, extra_page_bdt = 1000, free_care_plan_id = 'care_basic', free_care_months = 3
  where id = 'basic';
update plans set dev_price_usd_cents = 59900,  dev_price_bdt = 25000, renewal_yearly_usd_cents = 29900, renewal_yearly_bdt = 12000,
  pages_built = 15, storage_gb = 10, extra_page_usd_cents = 2900, extra_page_bdt = 1000, free_care_plan_id = 'care_pro', free_care_months = 3
  where id = 'pro';
update plans set dev_price_usd_cents = 119900, dev_price_bdt = 50000, renewal_yearly_usd_cents = 49900, renewal_yearly_bdt = 20000,
  pages_built = 30, storage_gb = 50, extra_page_usd_cents = 2900, extra_page_bdt = 1000, free_care_plan_id = 'care_pro', free_care_months = 12
  where id = 'biz';

-- ── Care plans ─────────────────────────────────────────────────────────────
create table if not exists care_plans (
  id                 text primary key,
  name               text not null,
  monthly_usd_cents  integer not null,
  yearly_usd_cents   integer not null,
  monthly_bdt        integer not null,
  yearly_bdt         integer not null,
  changes_per_month  integer,            -- null = fair use
  pages_per_month    integer not null default 0,
  response_hours     integer not null,
  features           jsonb not null default '[]'::jsonb,
  sort_order         integer not null default 0,
  is_active          boolean not null default true,
  created_at         timestamptz not null default now()
);

alter table care_plans enable row level security;
drop policy if exists care_plans_public_read on care_plans;
create policy care_plans_public_read on care_plans for select using (is_active);

insert into care_plans (id, name, monthly_usd_cents, yearly_usd_cents, monthly_bdt, yearly_bdt, changes_per_month, pages_per_month, response_hours, sort_order, features) values
 ('care_basic', 'Care Basic',    12900,  103200,  5000,  40000, 3,    0, 48, 1,
  '["Platform, hosting, SSL and daily backups","Domain renewal included","3 content or design changes a month","Response within 48 hours","Uptime and security monitoring"]'),
 ('care_pro',   'Care Pro',      29900,  239200, 12000,  96000, 10,   2, 24, 2,
  '["Everything in Care Basic","10 changes a month","2 new pages a month","Response within 24 hours","Monthly visitor and lead report","Search Console, schema and SEO checks","2 blog posts written a month","Lead follow-up setup (CRM, WhatsApp templates)"]'),
 ('care_business','Care Business',44900, 359200, 18000, 144000, null, 5, 8, 3,
  '["Everything in Care Pro","Unlimited changes (fair use)","5 new pages a month","Same-day response on a dedicated WhatsApp","Monthly report with a review call","4 blog posts written a month","1 ad landing page a month"]')
on conflict (id) do update set
  name = excluded.name, monthly_usd_cents = excluded.monthly_usd_cents, yearly_usd_cents = excluded.yearly_usd_cents,
  monthly_bdt = excluded.monthly_bdt, yearly_bdt = excluded.yearly_bdt, changes_per_month = excluded.changes_per_month,
  pages_per_month = excluded.pages_per_month, response_hours = excluded.response_hours,
  sort_order = excluded.sort_order, features = excluded.features;

-- ── Subscription state per tenant (one row per tenant, as before) ─────────
-- current_period_end stays the single "site is paid until" date that
-- dunning/suspension already read; it is kept = greatest(platform, care).
alter table subscriptions add column if not exists development_paid_at   timestamptz;
alter table subscriptions add column if not exists platform_paid_until   timestamptz;
alter table subscriptions add column if not exists care_plan_id          text references care_plans(id);
alter table subscriptions add column if not exists care_cycle            text check (care_cycle in ('monthly','yearly'));
alter table subscriptions add column if not exists care_paid_until       timestamptz;
alter table subscriptions add column if not exists care_is_free          boolean not null default false;
-- what a pending checkout is for: development | care | bundle | platform | legacy
alter table subscriptions add column if not exists pending_kind          text;
alter table subscriptions add column if not exists pending_care_plan_id  text;
alter table subscriptions add column if not exists pending_care_cycle    text;
