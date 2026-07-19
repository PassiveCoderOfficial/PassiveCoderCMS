-- Per-tenant color-token override, layered over the active template's static
-- palette. Null (default) means "use the template's palette untouched".
alter table site_identity add column if not exists color_overrides jsonb;
