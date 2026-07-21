-- 053_service_category_images.sql
-- Optional royalty-free image per service category (item_box's
-- marketplace_catalog source and the vendor directory can show a photo
-- alongside the Lucide icon for a richer home-page category showcase).

begin;

alter table public.service_categories
  add column if not exists image_url text,
  add column if not exists description text;

commit;
