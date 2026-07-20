-- 052_service_category_icons.sql
-- Lucide icons for marketplace service categories — same icon_type/icon
-- column shape as service_items (icon_type currently always "lucide" here,
-- kept for consistency/future svg support, matching the existing pattern).

begin;

alter table public.service_categories
  add column if not exists icon_type text not null default 'lucide',
  add column if not exists icon text;

commit;
