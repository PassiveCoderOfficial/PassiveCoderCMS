-- 022_custom_dev_department.sql
-- Add "Custom Development" support department so clients requesting bespoke
-- work land in an organized queue (used by the subscription page Contact Support CTA).

begin;

insert into public.support_departments (name, slug, is_active, sort_order)
values ('Custom Development', 'custom_dev', true, 4)
on conflict (slug) do nothing;

commit;
