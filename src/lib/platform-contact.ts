/**
 * Open edition: no built-in support number, logo or storage host. Set
 * NEXT_PUBLIC_SUPPORT_WHATSAPP (digits only, with country code) and
 * NEXT_PUBLIC_LOGO_URL if you want them; the storage host always comes from
 * NEXT_PUBLIC_SUPABASE_URL.
 */
export const PLATFORM_WHATSAPP = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? "";
export const PLATFORM_LOGO_URL = "";
export const PLATFORM_STORAGE_HOST = "";
