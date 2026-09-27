-- Staff-built demo sites: a personalised preview sent to a prospect over
-- WhatsApp before they pay. Non-null demo_expires_at = this tenant is a demo.
-- Past that date the public site shows a "paused" screen; nothing is ever
-- deleted. Going live (manual payment received) clears demo_expires_at.
alter table tenants add column if not exists demo_expires_at timestamptz;
alter table tenants add column if not exists demo_created_by uuid references auth.users(id) on delete set null;
alter table tenants add column if not exists demo_whatsapp text;
create index if not exists tenants_demo_idx on tenants (demo_created_by) where demo_expires_at is not null;
