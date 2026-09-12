-- Restaurant menu support (2026-09-12): spice level, dietary tags, veg/non-veg
-- flag. Kept separate from `attributes` (variant options like Size/Color) —
-- dietary_info is descriptive metadata, never generates variant SKUs.
alter table products
  add column if not exists dietary_info jsonb not null default '{}'::jsonb;

comment on column products.dietary_info is
  'Restaurant menu metadata: { spice_level?: 0-3, diet?: "veg"|"non_veg"|"vegan", tags?: string[] }';
