-- 055_seed_template_categories.sql
-- Ticket 5, Phase 2: seed the global template category list.
--
-- Mirrors the existing TEMPLATE_CATEGORIES taxonomy in
-- src/lib/templates/templates-data.ts (minus the "All" UI filter, which is
-- not a real category) so the picker isn't empty on day one and templates
-- authored via the new engine slot into the same categories the public
-- showcase already groups by.
--
-- SA can rename/reorder/add via the admin UI afterwards — these are just
-- the starting set, not a hardcoded enum.

INSERT INTO template_categories (name, slug, status, sort_order) VALUES
  ('Cleaning', 'cleaning', 'active', 0),
  ('HVAC & Plumbing', 'hvac-and-plumbing', 'active', 1),
  ('Renovation & Construction', 'renovation-and-construction', 'active', 2),
  ('Interior Design', 'interior-design', 'active', 3),
  ('Health & Beauty', 'health-and-beauty', 'active', 4),
  ('Automotive', 'automotive', 'active', 5),
  ('Events', 'events', 'active', 6),
  ('Retail & Shop', 'retail-and-shop', 'active', 7),
  ('General Business', 'general-business', 'active', 8),
  ('Restaurant & Cafe', 'restaurant-and-cafe', 'active', 9),
  ('Fitness & Sports', 'fitness-and-sports', 'active', 10),
  ('Legal & Finance', 'legal-and-finance', 'active', 11),
  ('Real Estate', 'real-estate', 'active', 12),
  ('Photography', 'photography', 'active', 13),
  ('Education', 'education', 'active', 14),
  ('Tech & Agency', 'tech-and-agency', 'active', 15)
ON CONFLICT (slug) DO NOTHING;
