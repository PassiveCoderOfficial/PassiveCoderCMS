-- Opt-in alumni showcase for the results module: the admin ticks which
-- students to feature; only those rows' name/photo/course/position are ever
-- served publicly (by /api/results/alumni-public, service role).
alter table public.results add column if not exists alumni_featured boolean not null default false;
alter table public.results add column if not exists alumni_position text;
alter table public.results add column if not exists alumni_location text;
alter table public.results add column if not exists alumni_quote text;
create index if not exists results_alumni_idx on public.results (tenant_id) where alumni_featured;
