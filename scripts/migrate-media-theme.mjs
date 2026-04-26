/**
 * Migration: add storage_path to media, site_theme to site_settings,
 * create the 'media' storage bucket, and set public access policy.
 *
 * Run: node scripts/migrate-media-theme.mjs
 */
import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

const env = readFileSync(new URL("../.env.local", import.meta.url), "utf-8");
const get = (key) => env.match(new RegExp(`^${key}=(.+)$`, "m"))?.[1]?.trim();

const supabaseUrl = get("NEXT_PUBLIC_SUPABASE_URL");
const serviceRoleKey = get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function run() {
  console.log("Running migration...\n");

  // 1. Add storage_path column to media (idempotent via IF NOT EXISTS trick)
  console.log("⚠  The Supabase JS client cannot run raw DDL (ALTER TABLE).");
  console.log("   Please run the following SQL in your Supabase dashboard SQL editor:\n");

  console.log(`-- 1. Add storage_path to media table
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS storage_path text;

-- 2. Add site_theme to site_settings table
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS site_theme text DEFAULT 'system'
  CHECK (site_theme IN ('light', 'dark', 'system'));

-- 3. Update existing site_settings row to have a default site_theme
UPDATE public.site_settings SET site_theme = 'system' WHERE site_theme IS NULL;
`);

  // 4. Create the storage bucket (this CAN be done via JS client)
  console.log("Creating 'media' storage bucket...");
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === "media");

  if (exists) {
    console.log("  ✓ Bucket 'media' already exists");
  } else {
    const { error: bucketError } = await supabase.storage.createBucket("media", {
      public: true,
      fileSizeLimit: 52428800, // 50 MB
      allowedMimeTypes: [
        "image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml", "image/avif",
        "video/mp4", "video/webm", "video/ogg",
        "audio/mpeg", "audio/ogg", "audio/wav",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/zip",
        "text/plain",
      ],
    });

    if (bucketError) {
      console.error("  ✗ Failed to create bucket:", bucketError.message);
    } else {
      console.log("  ✓ Bucket 'media' created (public, 50 MB limit)");
    }
  }

  // 5. Storage RLS policies — also need SQL editor
  console.log("\n   Also run this SQL for storage access policies:\n");
  console.log(`-- Allow authenticated users to upload to media bucket
INSERT INTO storage.policies (name, bucket_id, operation, definition)
VALUES
  ('Allow authenticated uploads', 'media', 'INSERT',
   '(auth.role() = ''authenticated'')'),
  ('Allow public downloads', 'media', 'SELECT',
   'true'),
  ('Allow owners to delete', 'media', 'DELETE',
   '(auth.role() = ''authenticated'')')
ON CONFLICT DO NOTHING;
`);

  console.log("Migration complete. Run the SQL statements above in Supabase SQL editor.\n");
}

run().catch(console.error);
