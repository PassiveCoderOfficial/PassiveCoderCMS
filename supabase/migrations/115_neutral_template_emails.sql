-- Follow-up to 114: sample emails on real-looking domains and short forms of
-- the old brand names that the exact-name swap didn't catch.
create or replace function pg_temp.neutral(s text) returns text language sql as $$
  select replace(replace(replace(replace(replace(replace(
    regexp_replace(s,
      '[A-Za-z0-9._-]+@(coolbreeze\.sg|cleanpro\.com|buildright\.sg|constructionpro\.com|nexaagency\.com|maizefashion\.com|colourcraft\.sg|shieldguard\.sg|luxespa\.com|roamerscollective\.example|trailheadexpeditions\.example|meridianvoyage\.example|uniformpro\.com\.bd)',
      'hello@yourbusiness.com', 'g'),
    'Nexa Agency', 'Your Business'), 'Maize Fashion', 'Your Business'),
    'Nexa ', 'Your Business '), 'Maize ', 'Your Business '),
    'Roamers ', 'Your Business '), 'Roamers', 'Your Business')
$$;

update pages p set
  blocks = pg_temp.neutral(p.blocks::text)::jsonb,
  seo = case when p.seo is null then null else pg_temp.neutral(p.seo::text)::jsonb end,
  title = pg_temp.neutral(p.title)
where p.template_id is not null;

update templates set
  global_header = case when global_header is null then null else pg_temp.neutral(global_header::text)::jsonb end,
  global_footer = case when global_footer is null then null else pg_temp.neutral(global_footer::text)::jsonb end,
  nav_items = case when nav_items is null then null else pg_temp.neutral(nav_items::text)::jsonb end,
  description = pg_temp.neutral(description);
