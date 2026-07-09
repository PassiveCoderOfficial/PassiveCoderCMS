-- Email/WhatsApp verification grace period for profiles
-- Safe to run multiple times

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_verified_at    timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS whatsapp_verified_at timestamptz;

CREATE INDEX IF NOT EXISTS profiles_verification_idx
  ON public.profiles (created_at)
  WHERE email_verified_at IS NULL AND whatsapp_verified_at IS NULL;
