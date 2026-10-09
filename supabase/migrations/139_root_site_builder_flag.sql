-- When true, the root domain (passivecoder.com) renders the root tenant's
-- published builder pages for "/" and the fixed marketing routes, instead of
-- the hard-coded marketing components. Off until the block pages are ready.
alter table homepage_settings add column if not exists use_builder_pages boolean not null default false;
