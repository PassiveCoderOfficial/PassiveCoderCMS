-- Store-wide defaults for the optional product-page sections (description /
-- details / shipping accordions, trust icons, story row, wide banner). A
-- product shows its own section when filled, otherwise the store default.
alter table public.site_settings add column if not exists product_defaults jsonb not null default '{}'::jsonb;
