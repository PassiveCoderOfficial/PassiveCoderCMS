import { CURRENCIES } from "@/lib/currency/currencies";
import { SITE_LANG_CODES } from "@/lib/i18n-site/storefront-text";
import { isValidTimeZone } from "@/lib/time/panel-tz";
import { GTM_ID_RE } from "@/components/site/google-tag-manager";
import { META_PIXEL_RE } from "@/lib/analytics/meta-pixel-id";
import { checkImage } from "@/lib/mcp/layout-patch";

/**
 * Pure rules behind update_site_settings and update_site_identity: the same
 * checks the dashboard applies when it saves (Settings > General, SEO,
 * Languages, Appearance, Analytics, Templates > Header & Footer > Site
 * Identity, Colors & Design), turned into column patches. No database, so
 * tests/mcp check them directly.
 *
 * Where each rule comes from:
 *  - timezone: any valid IANA zone (isValidTimeZone, lib/time/panel-tz).
 *  - language / site_languages / auto_translate_enabled: /api/site-languages
 *    (base codes from the supported list, the main language never listed as
 *    an extra one, the Google widget off while extra languages exist).
 *  - currency: the CURRENCIES list; the symbol follows the currency, as the
 *    General screen's picker sets it.
 *  - Search Console / Bing: the pasted meta tag or the bare code (General).
 *  - GA4, Tag Manager, Meta Pixel ids: /api/analytics/* (bare id or pasted snippet).
 *  - site_theme: /api/design.
 *  - brand colours: /api/design (hex, the five palette keys).
 */

function fail(msg: string): never {
  throw new Error(msg);
}

type Patch = Record<string, unknown>;
const text = (v: string | null | undefined) => (v === undefined ? undefined : v === null ? null : v.trim() || null);
const base = (code: string) => code.trim().toLowerCase().split("-")[0];

export type SettingsInput = {
  site_description?: string | null;
  timezone?: string;
  language?: string;
  site_languages?: string[];
  auto_translate_enabled?: boolean;
  currency?: string;
  currency_position?: "before" | "after";
  maintenance_mode?: boolean;
  maintenance_title?: string | null;
  maintenance_message?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  google_site_verification?: string | null;
  bing_site_verification?: string | null;
  allow_ai_training?: boolean;
  ga_measurement_id?: string | null;
  gtm_container_id?: string | null;
  meta_pixel_id?: string | null;
  site_theme?: "light" | "dark" | "system";
  custom_js?: string | null;
  analytics_code?: string | null;
};

export type CurrentSettings = { language?: string | null; site_languages?: string[] | null; auto_translate_enabled?: boolean | null };

/** "<meta name=... content="abc">" or "abc" -> "abc" (General > Search Console / Bing). */
export function verificationCode(v: string | null | undefined): string | null | undefined {
  if (v === undefined) return undefined;
  if (v === null) return null;
  const m = v.match(/content=["']([^"']+)["']/);
  return (m ? m[1] : v).trim() || null;
}

/** GA4 Measurement ID (/api/analytics/google/measurement-id). */
export function gaMeasurementId(v: string | null | undefined): string | null | undefined {
  if (v === undefined) return undefined;
  const t = (v ?? "").trim();
  if (t && !/^G-[A-Z0-9]+$/i.test(t)) fail("ga_measurement_id: that doesn't look like a GA4 Measurement ID (should look like G-XXXXXXXXXX).");
  return t || null;
}

/** Tag Manager container id, bare or pulled out of a pasted snippet (/api/analytics/google/gtm-id). */
export function gtmContainerId(v: string | null | undefined): string | null | undefined {
  if (v === undefined) return undefined;
  const raw = (v ?? "").trim();
  const id = (raw.match(/GTM-[A-Z0-9]+/i)?.[0] ?? raw).toUpperCase();
  if (id && !GTM_ID_RE.test(id)) fail("gtm_container_id: that doesn't look like a Tag Manager ID (should look like GTM-XXXXXXX).");
  return id || null;
}

/** Meta Pixel id, bare or pulled out of the pasted base code (/api/analytics/meta-pixel). */
export function metaPixelId(v: string | null | undefined): string | null | undefined {
  if (v === undefined) return undefined;
  const raw = (v ?? "").trim();
  const id = raw.match(/fbq\(\s*['"]init['"]\s*,\s*['"](\d{10,20})['"]/)?.[1] ?? raw.match(/[?&]id=(\d{10,20})/)?.[1] ?? raw;
  if (id && !META_PIXEL_RE.test(id)) fail("meta_pixel_id: that doesn't look like a Meta Pixel ID (15-16 digits, from Events Manager).");
  return id || null;
}

/** Language codes a site can be written in or translated to. */
export const SUPPORTED_LANGUAGES = [...SITE_LANG_CODES];

/**
 * Turn an update_site_settings call into a site_settings patch. Throws with a
 * plain message on anything the dashboard would refuse. `notes` explains
 * side effects (e.g. the Google widget switched off).
 */
export function buildSettingsPatch(cur: CurrentSettings, a: SettingsInput): { patch: Patch; notes: string[] } {
  const patch: Patch = {};
  const notes: string[] = [];

  if (a.site_description !== undefined) patch.site_description = a.site_description?.trim() ?? "";

  if (a.timezone !== undefined) {
    const tz = a.timezone.trim();
    if (!isValidTimeZone(tz)) fail(`timezone: "${a.timezone}" is not a time zone. Use an IANA name such as Asia/Dhaka, Asia/Singapore, Asia/Dubai or Europe/London.`);
    patch.timezone = tz;
  }

  // Languages (Settings > Languages): one main language, extra native
  // languages, and the Google Translate widget, which can't run with them.
  const curMain = base(cur.language || "en");
  let main = curMain;
  if (a.language !== undefined) {
    main = base(a.language);
    if (!SITE_LANG_CODES.has(main)) fail(`language: "${a.language}" is not supported. Use one of: ${SUPPORTED_LANGUAGES.join(", ")}.`);
    patch.language = main;
  }
  const curExtra = (cur.site_languages ?? []).map(base);
  let extra = curExtra;
  if (a.site_languages !== undefined) {
    const asked = a.site_languages.map(base);
    const unknown = asked.filter((l) => !SITE_LANG_CODES.has(l));
    if (unknown.length) fail(`site_languages: ${unknown.join(", ")} ${unknown.length === 1 ? "is" : "are"} not supported. Use codes from: ${SUPPORTED_LANGUAGES.join(", ")}.`);
    extra = asked;
  }
  extra = [...new Set(extra)].filter((l) => l !== main);
  if (a.site_languages !== undefined || (a.language !== undefined && main !== curMain && curExtra.includes(main))) {
    if (a.site_languages !== undefined && a.site_languages.map(base).includes(main)) notes.push(`${main} is the main language, so it is not listed as an extra language.`);
    patch.site_languages = extra;
  }
  if (a.auto_translate_enabled === true && extra.length) {
    fail("auto_translate_enabled: turn off your own languages first (site_languages: []). The Google Translate widget and your own translations can't run together.");
  }
  if (a.auto_translate_enabled !== undefined) patch.auto_translate_enabled = a.auto_translate_enabled;
  if (extra.length && a.site_languages !== undefined && cur.auto_translate_enabled && a.auto_translate_enabled === undefined) {
    patch.auto_translate_enabled = false;
    notes.push("The Google Translate widget was switched off: it can't run together with your own languages.");
  }

  if (a.currency !== undefined) {
    const c = CURRENCIES.find((x) => x.code === a.currency!.trim().toUpperCase());
    if (!c) fail(`currency: "${a.currency}" is not a supported currency code (e.g. USD, BDT, SGD, AED, SAR, QAR, MYR).`);
    patch.currency = c.code;
    patch.currency_symbol = c.symbol;
  }
  if (a.currency_position !== undefined) patch.currency_position = a.currency_position;

  if (a.maintenance_mode !== undefined) {
    patch.maintenance_mode = a.maintenance_mode;
    if (a.maintenance_mode) notes.push("Maintenance mode is on: visitors see the maintenance screen; signed-in users still see the site.");
  }
  if (a.maintenance_title !== undefined) patch.maintenance_title = text(a.maintenance_title);
  if (a.maintenance_message !== undefined) patch.maintenance_message = text(a.maintenance_message);

  if (a.meta_title !== undefined) patch.meta_title = text(a.meta_title);
  if (a.meta_description !== undefined) patch.meta_description = text(a.meta_description);
  if (a.google_site_verification !== undefined) patch.google_site_verification = verificationCode(a.google_site_verification);
  if (a.bing_site_verification !== undefined) patch.bing_site_verification = verificationCode(a.bing_site_verification);
  if (a.allow_ai_training !== undefined) patch.allow_ai_training = a.allow_ai_training;

  if (a.ga_measurement_id !== undefined) patch.ga_measurement_id = gaMeasurementId(a.ga_measurement_id);
  if (a.gtm_container_id !== undefined) patch.gtm_container_id = gtmContainerId(a.gtm_container_id);
  if (a.meta_pixel_id !== undefined) patch.meta_pixel_id = metaPixelId(a.meta_pixel_id);

  if (a.site_theme !== undefined) patch.site_theme = a.site_theme;

  // Settings > Appearance code fields. The script is rendered inside a
  // <script> tag: refuse anything that would close it.
  if (a.custom_js !== undefined) {
    if (a.custom_js && /<\/\s*script/i.test(a.custom_js)) fail("custom_js: plain JavaScript only, without <script> tags.");
    patch.custom_js = text(a.custom_js);
  }
  if (a.analytics_code !== undefined) patch.analytics_code = text(a.analytics_code);

  return { patch, notes };
}

// ── Site Identity ────────────────────────────────────────────────────────

/** The five palette colours Colors & Design (and /api/design) let a site override. */
export const COLOR_KEYS = ["primary", "secondary", "accent", "background", "foreground"] as const;
export type ColorKey = (typeof COLOR_KEYS)[number];
const HEX = /^#[0-9a-f]{3,8}$/i;

export type IdentityInput = {
  site_name?: string;
  tagline?: string | null;
  logo_url?: string | null;
  logo_dark_url?: string | null;
  logo_width?: number | null;
  logo_alt?: string | null;
  logo_type?: "image" | "text" | null;
  favicon_url?: string | null;
  /** null resets every colour to the template's; a key set to null resets that one. */
  colors?: Partial<Record<ColorKey, string | null>> | null;
};

/**
 * site_identity and site_settings patches for an update_site_identity call.
 * The name, logo and favicon are written to both tables: site_identity wins
 * where both are read (page titles, search results), and keeping them equal
 * means no reader falls back to an old copy.
 */
export function buildIdentityPatch(cur: { color_overrides?: Record<string, string> | null } | null, a: IdentityInput): { identity: Patch; settings: Patch; changed: string[] } {
  const identity: Patch = {};
  const settings: Patch = {};
  const changed: string[] = [];
  const img = (v: string | null | undefined, what: string) => (v === undefined ? undefined : v === null || !v.trim() ? null : checkImage(v, what));

  if (a.site_name !== undefined) {
    const n = a.site_name.trim();
    if (!n) fail("site_name is empty.");
    identity.site_name = n;
    settings.site_name = n;
    changed.push("site_name");
  }
  if (a.tagline !== undefined) { identity.tagline = text(a.tagline); changed.push("tagline"); }
  const logo = img(a.logo_url, "logo_url");
  if (logo !== undefined) { identity.logo_url = logo; settings.logo_url = logo; changed.push("logo_url"); }
  const dark = img(a.logo_dark_url, "logo_dark_url");
  if (dark !== undefined) { identity.logo_dark_url = dark; changed.push("logo_dark_url"); }
  if (a.logo_width !== undefined) { identity.logo_width = a.logo_width; changed.push("logo_width"); }
  if (a.logo_alt !== undefined) { identity.logo_alt = text(a.logo_alt); changed.push("logo_alt"); }
  if (a.logo_type !== undefined) { identity.logo_type = a.logo_type; changed.push("logo_type"); }
  const fav = img(a.favicon_url, "favicon_url");
  if (fav !== undefined) { identity.favicon_url = fav; settings.favicon_url = fav; changed.push("favicon_url"); }

  if (a.colors !== undefined) {
    if (a.colors === null) identity.color_overrides = null;
    else {
      const next: Record<string, string> = { ...(cur?.color_overrides ?? {}) };
      for (const [k, v] of Object.entries(a.colors)) {
        if (!(COLOR_KEYS as readonly string[]).includes(k)) fail(`colors.${k}: only ${COLOR_KEYS.join(", ")} can be set.`);
        if (v === undefined) continue;
        if (v === null || !v.trim()) { delete next[k]; continue; }
        if (!HEX.test(v.trim())) fail(`colors.${k}: use a colour like #1a2b3c.`);
        next[k] = v.trim();
      }
      identity.color_overrides = Object.keys(next).length ? next : null;
    }
    changed.push("colors");
  }
  if (!changed.length) fail("Nothing to change. Pass at least one field.");
  return { identity, settings, changed };
}
