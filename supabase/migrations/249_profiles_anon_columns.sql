-- 249: visitors who are not signed in could read every user's email and role.
-- They keep only the public profile fields.
revoke select on public.profiles from anon;
grant select (id, full_name, avatar_url, bio, website) on public.profiles to anon;