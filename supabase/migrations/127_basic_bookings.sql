-- Online booking on every plan, Basic included (2026-10-06, Wali). Every
-- site already ships with booking ready (migration 126); this shows the
-- Bookings dashboard on Basic too and lists it on the pricing table.
update public.plans
  set modules = jsonb_set(modules, '{bookings}', '{"included": true, "defaultOn": true}'::jsonb)
  where id = 'basic';
update public.plans
  set features = (
    select jsonb_agg(f order by i) from (
      select f, i from jsonb_array_elements(features) with ordinality as x(f, i)
      union all select to_jsonb('Online booking & appointment calendar'::text), 4.5
    ) s
  )
  where id = 'basic' and not features::text ilike '%booking%';
