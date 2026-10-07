-- Single-store product reviews + featuring a review as a homepage testimonial.
-- product_reviews already serves the marketplace (verified by delivered
-- sub-order). Single-store reviews have no sub-order: they come in from the
-- product page as 'pending' and the store approves them in the dashboard.
alter table public.product_reviews add column if not exists reviewer_email text;
alter table public.product_reviews add column if not exists verified boolean not null default false;
alter table public.product_reviews add column if not exists testimonial_id uuid;

drop policy if exists product_reviews_tenant_manage on public.product_reviews;
create policy product_reviews_tenant_manage on public.product_reviews
  for all using (public.is_tenant_editor(tenant_id)) with check (public.is_tenant_editor(tenant_id));

-- Testimonials can carry the product a review was about and a photo.
alter table public.testimonials add column if not exists title text;
alter table public.testimonials add column if not exists image_url text;
alter table public.testimonials add column if not exists product_name text;
alter table public.testimonials add column if not exists product_url text;
alter table public.testimonials add column if not exists verified boolean not null default false;
alter table public.testimonials add column if not exists source_review_id uuid;
