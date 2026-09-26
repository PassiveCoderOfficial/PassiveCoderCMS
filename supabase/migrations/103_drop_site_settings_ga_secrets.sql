-- Final step of the GA token move (see 101). Applied only after the code
-- reading tenant_integrations was live (v1.0.330) and verified end-to-end:
-- status endpoint returned connected + tokenValid + 5 GA4 properties using
-- the refresh token from the new table.
--
-- This is what actually closes the leak: until these columns are gone, the
-- public-read site_settings policy still exposes the old copies.

alter table site_settings
  drop column if exists ga_oauth_refresh_token,
  drop column if exists ga_oauth_access_token,
  drop column if exists ga_oauth_expires_at,
  drop column if exists ga_oauth_connected_email;
