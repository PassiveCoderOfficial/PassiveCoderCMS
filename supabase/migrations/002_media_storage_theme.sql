-- Migration 002: media storage_path column + site_theme + storage bucket policies

-- ─── Add storage_path to media ────────────────────────────────────────────────
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS storage_path text;

-- ─── Add site_theme to site_settings ─────────────────────────────────────────
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS site_theme text DEFAULT 'system'
  CHECK (site_theme IN ('light', 'dark', 'system'));

UPDATE public.site_settings SET site_theme = 'system' WHERE site_theme IS NULL;

-- ─── Storage bucket policies (run after creating bucket named 'media') ────────
-- Allow authenticated users to upload
CREATE POLICY IF NOT EXISTS "Authenticated users can upload media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'media');

-- Public read access
CREATE POLICY IF NOT EXISTS "Public can read media"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'media');

-- Authenticated users can delete their own uploads
CREATE POLICY IF NOT EXISTS "Authenticated users can delete media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'media');
