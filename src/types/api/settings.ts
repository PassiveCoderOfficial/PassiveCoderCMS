/**
 * Settings-area contracts shared by the web dashboard routes and the mobile
 * app (Settings, Business profile, Subscription). Import-free.
 */

/** GET/PATCH /api/tenant/settings — the site_settings row (subset used by clients). */
export interface SiteSettingsDto {
  id?: string;
  tenant_id?: string;
  site_description?: string | null;
  timezone?: string | null;
  language?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  google_site_verification?: string | null;
  bing_site_verification?: string | null;
  allow_ai_training?: boolean | null;
  currency?: string | null;
  currency_symbol?: string | null;
  currency_position?: "before" | "after" | null;
  auto_translate_enabled?: boolean | null;
  maintenance_mode?: boolean | null;
  maintenance_title?: string | null;
  maintenance_message?: string | null;
  site_theme?: "light" | "dark" | "system" | null;
  ga_measurement_id?: string | null;
  gtm_container_id?: string | null;
}

/** GET /api/identity -> identity (site_identity row, subset). */
export interface SiteIdentityDto {
  site_name: string | null;
  tagline: string | null;
  logo_url: string | null;
  logo_dark_url: string | null;
  logo_alt: string | null;
  logo_width: number | null;
  favicon_url: string | null;
}

export interface FontOptionDto { name: string; category: "sans" | "serif" | "display" }

/** GET /api/design */
export interface DesignResponse {
  templateId: string | null;
  palette: Record<string, string>;
  typography: { headingFont: string; bodyFont: string; headingWeight?: string; letterSpacing?: string };
  colorOverrides: Partial<Record<"primary" | "secondary" | "accent" | "background" | "foreground", string>>;
  designOverrides: {
    headingFont?: string; bodyFont?: string; headingWeight?: string; letterSpacing?: string;
    headingStyle?: "normal" | "italic"; roundness?: "sharp" | "soft" | "rounded" | "extra";
    shadow?: "none" | "subtle" | "normal" | "bold"; motion?: "none" | "cinematic"; headingColor?: string;
    /** Site-wide (PR #190): every section button fully rounded; card and item title weight. */
    buttonShape?: "pill"; cardHeadingWeight?: string;
  };
  siteTheme: "light" | "dark" | "system";
  fonts: FontOptionDto[];
}

/** GET /api/site-languages */
export interface SiteLanguagesResponse {
  main: string;
  languages: string[];
  googleWidget: boolean;
  translatedPages: number;
  available: Record<string, string>;
}

/** GET /api/redirects */
export interface RedirectRuleDto {
  id: string;
  from_path: string;
  to_path: string | null;
  to_url: string | null;
  status_code: number;
  page_id: string | null;
  hits: number | null;
  note: string | null;
  created_at: string;
}
export interface RedirectsResponse {
  rules: RedirectRuleDto[];
  pages: { id: string; title: string; slug: string }[];
}

/** GET/PUT /api/social-links */
export interface SocialLinkDto { platform: string; url: string; show?: boolean }

/** GET/PATCH /api/business-profile (tenant_business_profiles; every field optional). */
export interface BusinessProfileDto {
  business_name?: string | null;
  primary_service?: string | null;
  services?: string[] | null;
  owner_name?: string | null;
  years_operating?: number | null;
  customers_served?: number | null;
  projects_completed?: number | null;
  service_areas?: string[] | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  office_address?: string | null;
  city?: string | null;
  country_code?: string | null;
  opening_hours?: string | null;
  about?: string | null;
  completed_at?: string | null;
}
export interface BusinessProfileResponse { profile: BusinessProfileDto | null; seeded?: boolean }
export interface SocialLinksResponse { links: SocialLinkDto[]; fromBlocks: SocialLinkDto[]; available: boolean; error?: string }

/** POST /api/media/upload */
export interface MediaUploadResponse {
  media: { id?: string; url: string; size: number; originalSize: number; width: number | null; height: number | null; mime_type: string; name: string };
}

/** GET /api/aicoder/quota */
export interface AiQuotaDto {
  monthlyIncluded: number;
  usedThisMonth: number;
  purchasedRemaining: number;
  freeBuildCredits: number;
  resetAt: string;
  unlimited?: boolean;
  left?: number;
  total?: number;
  breakdown?: { section: number; chat: number; assistant: number; other: number };
}
/** GET /api/aicoder/packages */
export interface AiPackageDto { id: string; name: string; credits: number; price_usd_cents: number }

/** GET /api/partners/me (dashboard partner card; reseller-only since 2026-10-26). link / referrals / paidReferrals are no longer sent. */
export interface ReferralCardDto {
  show: boolean;
  link?: string;
  resellerLink?: string | null;
  reseller?: boolean;
  referrals?: number;
  paidReferrals?: number;
  credit?: { available: { BDT: number; USD: number }; pending: { BDT: number; USD: number } };
  canTurnOnReseller?: boolean;
  resellerPending?: boolean;
  code?: string | null;
  customCode?: string | null;
}
