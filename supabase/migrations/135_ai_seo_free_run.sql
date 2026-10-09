-- First "Generate SEO with AI" run per site is free; later runs use AiCoder generations.
alter table public.tenants add column if not exists ai_seo_free_used_at timestamptz;
