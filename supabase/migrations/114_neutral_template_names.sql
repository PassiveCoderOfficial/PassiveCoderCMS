-- Template names must never look like a real business (one matched a live
-- client exactly: "Free Bird SG"). Every template gets a descriptive
-- "industry - style" name and slug, and the brand name baked into its sample
-- copy becomes the neutral placeholder "Your Business", which
-- modules/templates/apply.ts swaps for the client's own site name on apply
-- (it used to swap the template's name, which is no longer in the copy).
--
-- The body class is `template-<slug>`, so each template's custom_css selectors
-- are rewritten to the new slug in the same statement.

create temporary table tpl_rename (old_slug text, new_slug text, new_name text) on commit drop;
insert into tpl_rename values
  ('aircon-and-plumbing-pro', 'aircon-plumbing',        'Aircon & Plumbing'),
  ('aperture-studio',         'photography-studio',     'Photography Studio'),
  ('bay-estates',             'real-estate-coastal',    'Real Estate - Coastal'),
  ('brightpath-academy',      'education-academy',      'Education & Training'),
  ('build-right',             'construction-bold',      'Construction - Bold'),
  ('cleaning-service',        'cleaning-simple',        'Cleaning - Simple'),
  ('clean-pro',               'cleaning-professional',  'Cleaning - Professional'),
  ('colour-craft',            'painting-decorating',    'Painting & Decorating'),
  ('construction-pro',        'construction-classic',   'Construction - Classic'),
  ('cool-breeze',             'air-conditioning',       'Air Conditioning'),
  ('forge-fitness',           'gym-fitness',            'Gym & Fitness'),
  ('free-bird-sg',            'renovation-modern',      'Renovation - Modern'),
  ('gather-events',           'events-venues',          'Events & Venues'),
  ('keystone-property',       'real-estate-classic',    'Real Estate - Classic'),
  ('luxe-spa',                'spa-beauty',             'Spa & Beauty'),
  ('maize-fashion',           'fashion-store',          'Fashion Store'),
  ('marketplace-pro',         'marketplace',            'Marketplace'),
  ('meridian-legal',          'law-firm',               'Law Firm'),
  ('meridian-voyage',         'travel-luxury',          'Travel - Luxury'),
  ('nexa-agency',             'creative-agency',        'Creative Agency'),
  ('restaurant-and-cafe',     'restaurant-cafe',        'Restaurant & Cafe'),
  ('roamers-collective',      'travel-adventure',       'Travel - Adventure'),
  ('shield-guard',            'security-services',      'Security Services'),
  ('torque-garage',           'auto-garage',            'Auto Garage'),
  ('trailhead-expeditions',   'travel-expeditions',     'Travel - Expeditions'),
  ('uniform-pro',             'uniforms-workwear',      'Uniforms & Workwear'),
  ('visa-horizon',            'visa-immigration',       'Visa & Immigration'),
  ('warm-kitchen',            'home-kitchen-catering',  'Home Kitchen & Catering');

-- 1. Sample copy in the template's own pages: old brand name -> placeholder.
update pages p set
  blocks  = replace(p.blocks::text,  t.name, 'Your Business')::jsonb,
  seo     = case when p.seo is null then null else replace(p.seo::text, t.name, 'Your Business')::jsonb end,
  title   = replace(p.title, t.name, 'Your Business'),
  excerpt = replace(p.excerpt, t.name, 'Your Business')
from templates t join tpl_rename r on r.old_slug = t.slug
where p.template_id = t.id;

-- 2. Template chrome + identity: placeholder in copy, new name/slug, CSS class.
update templates t set
  global_header = case when t.global_header is null then null else replace(t.global_header::text, t.name, 'Your Business')::jsonb end,
  global_footer = case when t.global_footer is null then null else replace(t.global_footer::text, t.name, 'Your Business')::jsonb end,
  nav_items     = case when t.nav_items is null then null else replace(t.nav_items::text, t.name, 'Your Business')::jsonb end,
  description   = replace(t.description, t.name, 'this business'),
  custom_css    = replace(t.custom_css, 'template-' || r.old_slug, 'template-' || r.new_slug),
  name          = r.new_name,
  slug          = r.new_slug
from tpl_rename r
where r.old_slug = t.slug;

-- 3. History column on sites that use them (nothing reads it; kept honest).
update site_identity s set active_template_slug = r.new_slug
from tpl_rename r where s.active_template_slug = r.old_slug;
