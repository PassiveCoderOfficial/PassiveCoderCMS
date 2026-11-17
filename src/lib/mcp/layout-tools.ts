import { z } from "zod";
import type { McpCtx, McpTool } from "@/lib/mcp/tools";
import { invalidateSiteCache } from "@/lib/supabase/public-cache";
import { creditPolicyFor } from "@/lib/site/footer-credit";
import { saveGlobalLayoutUpsert, upsertSiteIdentity } from "@/lib/site/global-layout";
import { toBlocks } from "@/lib/site/global-blocks";
import {
  applyFooterPatch, applyHeaderPatch, applyPrefooterPatch, summarizeFooter, summarizeHeader, summarizePrefooter,
  type FooterPatch, type HeaderPatch, type MenuInfo, type PrefooterPatch,
} from "@/lib/mcp/layout-patch";
import { buildIdentityPatch, buildSettingsPatch, SUPPORTED_LANGUAGES, type CurrentSettings, type IdentityInput, type SettingsInput } from "@/lib/mcp/settings-patch";
import { menuItem, toNavItems, LOCATIONS, type MenuItemIn } from "@/lib/mcp/setup-tools";

/**
 * MCP tools for the site chrome and site-wide settings (2026-11-09): the
 * header, footer and pre-footer edited in place (no need to resend whole
 * block JSON), Site Identity (name, tagline, logos, favicon, brand colours)
 * and Settings (General, SEO, Languages, Appearance, Analytics). Reported: "on
 * header and footer, also in the general settings, the mcp connector cannot
 * work". The edits themselves are pure functions (layout-patch.ts,
 * settings-patch.ts) with the dashboard's rules; these tools load the rows,
 * apply them and write.
 *
 * Every write:
 *  - is scoped to ctx.tenantId (super admins reach other sites through the
 *    route's `site` argument, never here);
 *  - creates the site_identity row when a site has none (upsertSiteIdentity),
 *    instead of the old "Open Site Identity in the dashboard once";
 *  - respects the layout lock (header, footer and Site Identity are layout;
 *    settings are not), like the database does for the dashboard;
 *  - expires the site's public cache (invalidateSiteCache), the same expiry a
 *    dashboard save triggers through the Supabase client, so the live site
 *    shows the change on the next request. SEO facts (JSON-LD, llms.txt)
 *    follow within their 10-minute cache.
 * The route adds the audit rows (mcp_audit + Action List) around each call.
 */

function fail(msg: string): never {
  throw new Error(msg);
}

const looseBool = z.preprocess((v) => (v === "true" ? true : v === "false" ? false : v), z.boolean());
const bool = looseBool.optional();
const nul = (max: number) => z.string().max(max).nullable().optional();
const colorIn = nul(60);
const urlIn = nul(1000);
const label = z.string().trim().min(1).max(80);
const pos = z.coerce.number().int().min(1).max(100);
const ref = z.union([z.string().min(1).max(120), z.coerce.number().int().min(1)]);
const buttonStyle = z.enum(["solid", "gradient", "outline"]);

/** Header, footer and Site Identity are page layout: refused on a layout-locked site, as in the dashboard. */
async function assertLayoutWritable(ctx: McpCtx) {
  const { layoutLockedFor, LAYOUT_LOCK_MESSAGE } = await import("@/lib/tenant/layout-lock");
  if (await layoutLockedFor(ctx.supabase, ctx.userId, ctx.tenantId)) fail(LAYOUT_LOCK_MESSAGE);
}

async function chrome(ctx: McpCtx) {
  const { data } = await ctx.supabase.from("site_identity")
    .select("global_header, global_footer, global_prefooter, site_name, tagline, logo_url, logo_dark_url, favicon_url")
    .eq("tenant_id", ctx.tenantId).maybeSingle();
  return (data ?? null) as Record<string, unknown> | null;
}

async function menusByLocation(ctx: McpCtx): Promise<Record<string, MenuInfo>> {
  const { data } = await ctx.supabase.from("nav_menus").select("name, location, items").eq("tenant_id", ctx.tenantId);
  const out: Record<string, MenuInfo> = {};
  for (const m of (data ?? []) as { name: string; location: string | null; items: MenuInfo["items"] | null }[]) {
    if (m.location && m.location !== "none" && !out[m.location]) out[m.location] = { name: m.name, items: Array.isArray(m.items) ? m.items : [] };
  }
  return out;
}

async function creditInfo(tenantId: string) {
  const policy = await creditPolicyFor(tenantId);
  return { editable: policy.editable, text: policy.base.text };
}

// ── Schemas ──────────────────────────────────────────────────────────────

const headerSchema = z.object({
  blockId: z.string().max(80).optional().describe("Only if the header area holds several blocks: the header block id from get_site_layout."),
  logo: z.object({
    text: nul(80).describe("Logo text / business name (shown when there is no logo image; on header builder layouts also beside the image with showName)."),
    imageUrl: urlIn.describe("Logo image for the header only; null = use the site logo from Site Identity (update_site_identity)."),
    darkImageUrl: urlIn.describe("Header builder only: logo for dark backgrounds."),
    height: z.coerce.number().int().min(16).max(200).nullable().optional().describe("Logo height in px."),
    linkUrl: urlIn.describe("Where the logo links; null = home page."),
    showName: bool.describe("Header builder only: show the logo text beside the logo image."),
    textColor: colorIn.describe("Header builder only: colour of the logo text."),
    iconUrl: urlIn.describe("Nav Menu only: small icon before the logo text."),
    caption: nul(120).describe("Nav Menu only: small line beside the logo, e.g. a registration number."),
  }).optional(),
  menu: z.object({
    location: z.enum(LOCATIONS).nullable().optional().describe("Show the menu assigned to this location (edit it with upsert_menu; \"header\" is usual). null = use the inline items below."),
    items: z.array(menuItem.extend({
      highlight: z.enum(["gold", "brand", "dark"]).optional().describe("Show this item as a pill."),
      lang: z.string().min(2).max(10).optional().describe("Language switch: opens the current page in this language (e.g. bn)."),
    })).max(50).optional().describe("Inline menu items (replaces the list; used when no location is set). Flat links only. For dropdowns use a saved menu: upsert_menu takes nested items (3 levels) and the header reads it through location."),
    style: z.enum(["default", "centered", "split", "minimal"]).optional().describe("Header builder only: menu style."),
    textColor: colorIn,
    activeColor: colorIn,
    uppercase: bool.describe("Nav Menu only: upper-case menu labels."),
  }).optional(),
  cta: z.object({
    show: bool.describe("Show or hide the header button."),
    label: z.string().trim().min(1).max(60).optional(),
    url: z.string().trim().min(1).max(1000).optional(),
    style: buttonStyle.optional(),
    color: colorIn.describe("Nav Menu only: button colour; null = brand colours."),
    textColor: colorIn.describe("Nav Menu only."),
    hideOnTablet: bool.describe("Nav Menu only: hide the button from 768 to 1023px."),
  }).optional(),
  booking: z.object({
    show: bool.describe("The Booking button: opens the booking page (/book) so visitors pick a time."),
    label: z.string().trim().min(1).max(60).optional(),
    url: z.string().trim().min(1).max(1000).optional(),
    style: buttonStyle.optional().describe("Header builder only."),
  }).optional(),
  cart: z.object({ show: bool, showLabel: bool.describe("Header builder only: show the word \"Cart\".") }).optional(),
  account: z.object({ show: bool, showLabel: bool.describe("Header builder only: show \"Account\" / \"Sign in\".") }).optional(),
  sticky: bool.describe("Stays on screen while scrolling."),
  transparent: bool.describe("Transparent over the hero image."),
  solidOnScroll: bool.describe("Transparent at the top, solid once the visitor scrolls."),
  glass: bool.describe("Frosted glass when solid."),
  style: z.enum(["default", "centered", "split", "minimal", "logo-center", "logo-center-inline"]).optional().describe("Nav Menu only: header style."),
  mobileLayout: z.enum(["default", "centered-logo", "menu-left", "spaced"]).optional().describe("Nav Menu only, phones only: \"centered-logo\" (menu left, logo centred, 2 icons right), \"menu-left\" (menu + logo left, call + WhatsApp right), \"spaced\" (logo left, even icons, menu last) or \"default\"."),
  colors: z.object({ background: colorIn, gradientTo: colorIn, text: colorIn, active: colorIn }).optional().describe("Nav Menu only: bar colours; null clears one."),
  shadow: bool.describe("Nav Menu only."),
  borderBottom: bool.describe("Nav Menu only."),
  topBar: z.object({
    show: bool,
    align: z.enum(["split", "center"]).optional().describe("\"split\": info left, phone + WhatsApp right; \"center\": one centred announcement."),
    items: z.array(z.object({
      text: z.string().trim().min(1).max(160),
      icon: z.string().max(24).optional().describe("pin, phone, clock, mail, facebook, instagram or info."),
      url: z.string().max(1000).optional(),
      side: z.enum(["left", "right"]).optional(),
      hideOnMobile: bool,
    })).max(12).optional().describe("Info items (replaces the list), e.g. address, hours, an email as { text, icon: \"mail\", url: \"mailto:...\" }."),
    showPhone: bool.describe("Phone from the business profile."),
    showWhatsapp: bool.describe("WhatsApp button from the business profile."),
    whatsappLabel: nul(40),
    showSocials: bool.describe("The site's social icons (business profile social_links)."),
    socialsLabel: nul(40),
    socialsBrandColors: bool,
    socialsStyle: z.enum(["default", "app"]).optional(),
    background: colorIn,
    textColor: colorIn,
    hideOnMobile: bool,
    uppercase: bool,
    rotate: bool.describe("Centred bar: show one item at a time."),
    rotateSeconds: z.coerce.number().int().min(2).max(60).optional(),
    scroll: bool.describe("Centred bar: items scroll across as a ticker."),
    scrollSeconds: z.coerce.number().int().min(8).max(90).optional().describe("Seconds per ticker loop (lower is faster)."),
    languages: z.array(z.string().min(2).max(10)).max(12).optional().describe("Google Translate language menu in the bar, in order (codes like en, ar, zh-CN). Needs auto_translate_enabled (update_site_settings). [] removes it."),
    languagesIcon: z.enum(["default", "google"]).optional(),
    sticky: bool.describe("Keep the top bar visible with a sticky header."),
  }).optional().describe("Nav Menu only: the thin strip above the header."),
  data: z.record(z.string(), z.unknown()).optional().describe("Any other field of the header block's data, merged in (null removes a key). The field names are in get_site_layout's blocks."),
});

const linkIn = z.object({ label, url: z.string().trim().min(1).max(1000), lang: z.string().max(10).optional() });

const columnOp = z.discriminatedUnion("op", [
  z.object({ op: z.literal("add"), heading: label, text: z.string().max(1000).optional(), links: z.array(linkIn).max(30).optional(), position: pos.optional() }),
  z.object({ op: z.literal("update"), column: ref, heading: label.optional(), text: nul(1000) }),
  z.object({ op: z.literal("remove"), column: ref }),
  z.object({ op: z.literal("move"), column: ref, to: pos }),
  z.object({ op: z.literal("add_link"), column: ref, label, url: z.string().trim().min(1).max(1000), lang: z.string().max(10).optional(), position: pos.optional() }),
  z.object({ op: z.literal("update_link"), column: ref, link: ref, label: label.optional(), url: z.string().trim().min(1).max(1000).optional(), lang: nul(10) }),
  z.object({ op: z.literal("remove_link"), column: ref, link: ref }),
  z.object({ op: z.literal("move_link"), column: ref, link: ref, to: pos }),
]);

const linkOp = z.discriminatedUnion("op", [
  z.object({ op: z.literal("add"), label, url: z.string().trim().min(1).max(1000), lang: z.string().max(10).optional(), position: pos.optional() }),
  z.object({ op: z.literal("update"), link: ref, label: label.optional(), url: z.string().trim().min(1).max(1000).optional(), lang: nul(10) }),
  z.object({ op: z.literal("remove"), link: ref }),
  z.object({ op: z.literal("move"), link: ref, to: pos }),
]);

const PLATFORMS = ["facebook", "instagram", "twitter", "linkedin", "youtube", "tiktok", "whatsapp", "snapchat"] as const;

const footerSchema = z.object({
  blockId: z.string().max(80).optional().describe("Only if the footer area holds several Footer Columns blocks: its id from get_site_layout."),
  logoText: nul(80),
  logoImage: urlIn.describe("Logo image for the footer only; null = the site logo."),
  logoIcon: urlIn.describe("Small icon before the logo text."),
  logoLink: urlIn,
  caption: nul(120).describe("Small line under the logo, e.g. a registration number."),
  tagline: nul(300),
  autoLightLogo: bool.describe("Dark footer: use the logo for dark backgrounds (Site Identity logo_dark_url)."),
  logoPlate: bool.describe("White backing behind the logo."),
  wordmark: bool.describe("Giant brand name across the bottom."),
  largeTapTargets: bool.describe("Bigger links on phones."),
  style: z.enum(["dark", "light", "colored", "retail"]).optional(),
  colors: z.object({ background: colorIn, text: colorIn, accent: colorIn }).nullable().optional().describe("Custom colours (accent = headings). null = back to the theme's colours."),
  copyright: z.object({
    text: nul(300).describe("Copyright line; {year} becomes the current year. null = the default \"© <year> <logo text>. All rights reserved.\""),
    showYear: bool.describe("Year in the default line."),
  }).optional(),
  newsletter: z.object({ show: bool, label: nul(120), placeholder: nul(120) }).optional(),
  booking: z.object({ show: bool, title: nul(120), text: nul(300), label: nul(60), url: urlIn }).optional().describe("Booking strip: an invitation plus a button to the booking page."),
  socials: z.object({
    useBusinessProfile: bool.describe("Show the site's social links from the business profile (one list for the whole site, set with update_business_profile social_links). The links below stay as the fallback."),
    links: z.array(z.object({ platform: z.enum(PLATFORMS), url: z.string().trim().max(500) })).max(12).optional().describe("Footer's own social links (replaces the list)."),
    heading: nul(80).describe("Heading above the icons, e.g. Follow us."),
    brandColors: bool,
  }).optional(),
  columns: z.array(columnOp).max(40).optional().describe("Link column edits, applied in order. Columns and links are picked by id, by heading/label (case-insensitive) or by 1-based position. ops: add {heading, text?, links?, position?}; update {column, heading?, text?}; remove {column}; move {column, to}; add_link {column, label, url, lang?, position?}; update_link {column, link, label?, url?, lang?}; remove_link {column, link}; move_link {column, link, to}. Links: https://, /, #, mailto: or tel:."),
  bottomLinks: z.array(linkOp).max(20).optional().describe("Links beside the copyright line (Privacy, Terms). ops: add {label, url, position?}; update {link, label?, url?}; remove {link}; move {link, to}."),
  credit: z.object({ show: bool, text: nul(80), url: urlIn }).optional().describe("\"Powered by Passive Coder\" credit: show false hides it; text/url change it (plain text, http/https link); null restores the default. Pro, Biz and Custom plans only."),
  paymentImage: urlIn.describe("Retail style: payment logos image."),
  bottomNote: nul(200).describe("Retail style: short line at the end of the bottom row."),
  data: z.record(z.string(), z.unknown()).optional().describe("Any other field of the footer block's data, merged in (null removes a key)."),
  prefooter: z.object({
    show: bool.describe("Hide or show the whole pre-footer (kept when hidden)."),
    cta: z.object({
      title: z.string().trim().min(1).max(160).optional(),
      description: nul(400),
      primaryButton: z.object({ label: z.string().trim().min(1).max(60).optional(), url: z.string().trim().min(1).max(1000).optional() }).optional(),
      secondaryButton: z.object({ label: z.string().trim().min(1).max(60).optional(), url: z.string().trim().min(1).max(1000).optional() }).nullable().optional().describe("null removes it."),
    }).optional().describe("The pre-footer banner (added if missing: needs title and primaryButton)."),
    contact: z.object({
      title: z.string().trim().min(1).max(160).optional(),
      subtitle: nul(300),
      phone: nul(60),
      email: nul(200),
      address: nul(400),
      recipientEmail: nul(200).describe("Where form messages go; defaults to email."),
      showMap: bool,
      hideForm: bool.describe("Details only, no form."),
    }).optional().describe("The pre-footer contact form (added if missing: needs title)."),
  }).optional().describe("The pre-footer: shown above the footer on every page that has no contact form of its own."),
});

const settingsSchema = z.object({
  site_name: z.string().trim().min(1).max(120).optional().describe("The site's name (Site Identity); kept the same in Site Identity and Settings."),
  site_description: nul(1000).describe("What the site is about (General)."),
  timezone: z.string().min(1).max(64).optional().describe("IANA time zone, e.g. Asia/Dhaka, Asia/Singapore, Asia/Dubai."),
  language: z.string().min(2).max(10).optional().describe("Main language the pages are written in, e.g. en, ar, bn."),
  site_languages: z.array(z.string().min(2).max(10)).max(30).optional().describe("Extra languages with their own translated pages (Settings > Languages); replaces the list. [] removes them all."),
  auto_translate_enabled: bool.describe("Google Translate widget. Only without extra languages."),
  currency: z.string().min(3).max(3).optional().describe("Base currency code, e.g. USD, BDT, SGD, AED. The symbol follows."),
  currency_position: z.enum(["before", "after"]).optional(),
  maintenance_mode: bool.describe("Maintenance screen for visitors (signed-in users still see the site)."),
  maintenance_title: nul(200),
  maintenance_message: nul(2000),
  meta_title: nul(300).describe("Default page title for search results."),
  meta_description: nul(1000).describe("Default search description."),
  google_site_verification: nul(1000).describe("Google Search Console HTML tag or its code."),
  bing_site_verification: nul(1000).describe("Bing Webmaster Tools meta tag or its code."),
  allow_ai_training: bool.describe("Let AI companies train on the site (AI search can read it either way)."),
  ga_measurement_id: nul(40).describe("GA4 Measurement ID, G-XXXXXXXXXX; null removes it."),
  gtm_container_id: nul(20000).describe("Google Tag Manager id GTM-XXXXXXX (or the pasted snippet); null removes it."),
  meta_pixel_id: nul(20000).describe("Meta (Facebook) Pixel id (or the pasted base code); null removes it."),
  site_theme: z.enum(["light", "dark", "system"]).optional().describe("Visitor colour scheme (Settings > Appearance)."),
  custom_js: nul(100_000).describe("Settings > Appearance > Custom JavaScript (plain script, no tags). Only when the owner asks."),
  analytics_code: nul(100_000).describe("Settings > Appearance > Analytics Code (a tracking snippet). Only when the owner asks."),
});

const identitySchema = z.object({
  site_name: z.string().trim().min(1).max(120).optional(),
  tagline: nul(200),
  logo_url: urlIn.describe("Main logo (light backgrounds), e.g. from upload_media. null removes it."),
  logo_dark_url: urlIn.describe("Logo for dark backgrounds."),
  logo_width: z.coerce.number().int().min(16).max(1000).nullable().optional(),
  logo_alt: nul(200),
  logo_type: z.enum(["image", "text"]).nullable().optional(),
  favicon_url: urlIn.describe("Browser tab and search icon."),
  colors: z.object({
    primary: colorIn, secondary: colorIn, accent: colorIn, background: colorIn, foreground: colorIn,
  }).nullable().optional().describe("Brand colours over the template's palette (Colors & Design), hex like #1a2b3c. A colour set to null goes back to the template's; colors: null resets all."),
});

type IdentityArgs = z.infer<typeof identitySchema>;
type HeaderArgs = z.infer<typeof headerSchema>;
type FooterArgs = z.infer<typeof footerSchema>;
type SettingsArgs = z.infer<typeof settingsSchema>;

// ── Writers ──────────────────────────────────────────────────────────────

/**
 * Site Identity write shared by update_site_identity and set_site_branding:
 * site_identity (created when missing) plus the site_settings copies of the
 * name, logo and favicon.
 */
export async function writeIdentity(ctx: McpCtx, input: IdentityInput): Promise<{ updated: string[]; siteIdentityCreated: boolean }> {
  const { data: cur } = await ctx.supabase.from("site_identity").select("id, color_overrides").eq("tenant_id", ctx.tenantId).maybeSingle();
  const { identity, settings, changed } = buildIdentityPatch(cur as { color_overrides?: Record<string, string> | null } | null, input);
  if (Object.keys(identity).length) {
    const err = await upsertSiteIdentity(ctx.supabase, ctx.tenantId, identity);
    if (err) fail(err);
  }
  if (Object.keys(settings).length) {
    const { error } = await ctx.supabase.from("site_settings").upsert({ tenant_id: ctx.tenantId, ...settings, updated_at: new Date().toISOString() }, { onConflict: "tenant_id" });
    if (error) fail(error.message);
  }
  invalidateSiteCache(ctx.tenantId);
  return { updated: changed, siteIdentityCreated: !cur };
}

async function saveChrome(ctx: McpCtx, cols: { global_header?: unknown; global_footer?: unknown; global_prefooter?: unknown }, existed: boolean) {
  const err = await saveGlobalLayoutUpsert(ctx.supabase, ctx.tenantId, cols);
  if (err) fail(err);
  invalidateSiteCache(ctx.tenantId);
  return existed ? {} : { note: "This site had no Site Identity record yet; it was created." };
}

const LANGUAGE_NOTE = "Language versions of the site (e.g. /ar pages) keep their own translated copy of the header and footer.";

// ── Tools ────────────────────────────────────────────────────────────────

export const SITE_CHROME_TOOLS: McpTool[] = [
  {
    name: "get_site_layout",
    title: "Get site header, footer and pre-footer",
    description: "Read the site-wide header, footer and pre-footer (shown on every page) with a short plain summary of each: which header type (the Nav Menu block or a header builder layout of Logo / Menu / Button elements), logo, menu and its location, buttons, footer columns and links, socials, copyright and credit. Also the Site Identity basics and which menu sits at which location. Use before update_site_header / update_site_footer. blocks: false returns only the summaries.",
    schema: z.object({ blocks: bool }),
    write: false,
    run: async (a: { blocks?: boolean }, ctx) => {
      const [row, menus, credit] = await Promise.all([chrome(ctx), menusByLocation(ctx), creditInfo(ctx.tenantId)]);
      const header = toBlocks(row?.global_header);
      const footer = toBlocks(row?.global_footer);
      const prefooter = toBlocks(row?.global_prefooter);
      const h = summarizeHeader(header, menus);
      const f = summarizeFooter(footer, credit);
      const withBlocks = a.blocks !== false;
      return {
        header: { type: h.model === "builder" ? "header builder layout" : h.model === "navigation" ? "Nav Menu block" : null, blockId: h.blockId, summary: h.text, ...(withBlocks ? { blocks: header } : {}) },
        footer: { blockId: f.blockId, summary: f.text, ...(withBlocks ? { blocks: footer } : {}) },
        prefooter: { summary: summarizePrefooter(prefooter), ...(withBlocks ? { blocks: prefooter } : {}) },
        identity: row ? { site_name: row.site_name ?? null, tagline: row.tagline ?? null, logo_url: row.logo_url ?? null, logo_dark_url: row.logo_dark_url ?? null, favicon_url: row.favicon_url ?? null } : null,
        menus: Object.entries(menus).map(([location, m]) => ({ location, name: m.name, items: m.items.length })),
        footerCredit: credit.editable ? "editable on this plan" : "locked on this plan",
        howToEdit: "update_site_header and update_site_footer change single fields in place; set_site_header replaces a whole area; upsert_menu edits the menus; update_site_identity sets the name, logo, favicon and brand colours. " + LANGUAGE_NOTE,
      };
    },
  },
  {
    name: "update_site_header",
    title: "Edit the site header",
    description: "Change parts of the site-wide header in place, without resending its JSON: logo (text, image, height, link), menu (location or inline items), the header button (show, label, link, style), the Booking button, cart and account icons, sticky / transparent / solid on scroll, and on the Nav Menu header also style, phone layout (mobileLayout), colours and the top bar (info items, phone, WhatsApp, social icons, language menu). Other block options (e.g. the Nav Menu's stickyRows, showSearch, languageSwitch, trackOrderUrl, menuRowBackground) go through data. Works on both header types; a field only the other type has is refused with the list of what this header supports (get_site_layout shows the type). Links must start with https://, /, #, mailto: or tel:. null clears a field back to its default. Goes live immediately. " + LANGUAGE_NOTE,
    schema: headerSchema,
    write: true,
    run: async (a: HeaderArgs, ctx) => {
      await assertLayoutWritable(ctx);
      const row = await chrome(ctx);
      const patch = { ...a } as unknown as HeaderPatch;
      if (a.menu?.items) {
        const items = a.menu.items;
        const resolved = await toNavItems(ctx, items as MenuItemIn[]);
        patch.menu = { ...patch.menu, items: resolved.map((it, i) => ({ ...it, ...(items[i].highlight ? { highlight: items[i].highlight } : {}), ...(items[i].lang ? { lang: items[i].lang } : {}) })) };
      }
      const res = applyHeaderPatch(row?.global_header, patch);
      if (!res.changes.length) return { saved: false, note: "Nothing changed: the header already has these values.", header: summarizeHeader(res.blocks, await menusByLocation(ctx)).text };
      const extra = await saveChrome(ctx, { global_header: res.blocks }, !!row);
      return { saved: true, headerType: res.model === "builder" ? "header builder layout" : "Nav Menu block", blockId: res.blockId, changed: res.changes, ...(res.notes.length ? { notes: res.notes } : {}), ...extra, header: summarizeHeader(res.blocks, await menusByLocation(ctx)).text };
    },
  },
  {
    name: "update_site_footer",
    title: "Edit the site footer and pre-footer",
    description: "Change parts of the site-wide footer in place: logo text/image, tagline, style and colours, link columns (add, rename, remove, reorder) and the links inside them (add, edit, remove, reorder, picked by id, label or position), bottom links, social icons (the business profile's list or the footer's own), newsletter signup, booking strip, copyright text ({year} = current year) and the \"Powered by\" credit (Pro, Biz and Custom plans only). prefooter edits the pre-footer above it (banner and contact form) or hides/shows it. null clears a field. Goes live immediately. " + LANGUAGE_NOTE,
    schema: footerSchema,
    write: true,
    run: async (a: FooterArgs, ctx) => {
      await assertLayoutWritable(ctx);
      const { prefooter, ...footerArgs } = a;
      const footerPatch = footerArgs as unknown as FooterPatch;
      const hasFooter = Object.entries(footerPatch).some(([k, v]) => k !== "blockId" && v !== undefined);
      if (!hasFooter && !prefooter) fail("Nothing to change. Pass footer fields and/or prefooter.");
      const row = await chrome(ctx);
      const cols: { global_footer?: unknown; global_prefooter?: unknown } = {};
      const changed: string[] = [];
      const notes: string[] = [];
      let blockId: string | undefined;
      if (hasFooter) {
        const editable = footerPatch.credit ? (await creditPolicyFor(ctx.tenantId)).editable : false;
        const res = applyFooterPatch(row?.global_footer, footerPatch, { creditEditable: editable });
        blockId = res.blockId;
        if (res.changes.length) { cols.global_footer = res.blocks; changed.push(...res.changes); }
        notes.push(...res.notes);
      }
      if (prefooter) {
        const res = applyPrefooterPatch(row?.global_prefooter, prefooter as PrefooterPatch);
        cols.global_prefooter = res.blocks;
        changed.push(...res.changes);
      }
      if (!Object.keys(cols).length) return { saved: false, note: "Nothing changed: the footer already has these values.", ...(notes.length ? { notes } : {}) };
      const extra = await saveChrome(ctx, cols, !!row);
      const credit = await creditInfo(ctx.tenantId);
      return {
        saved: true, ...(blockId ? { blockId } : {}), changed, ...(notes.length ? { notes } : {}), ...extra,
        ...(cols.global_footer ? { footer: summarizeFooter(cols.global_footer, credit).text } : {}),
        ...(cols.global_prefooter ? { prefooter: summarizePrefooter(cols.global_prefooter) } : {}),
      };
    },
  },
  {
    name: "update_site_identity",
    title: "Set site name, logo and brand colours",
    description: "Site Identity: the site's name, tagline, logo (light and dark-background versions, width, alt text, image or text logo), favicon (browser tab and search icon) and brand colours (primary, secondary, accent, background, foreground over the template's palette). Only the fields passed change; null clears one. The name, logo and favicon are kept the same in Site Identity and Settings. Logos and icons are image links, e.g. from upload_media. A header or footer logo field set on the block itself still overrides the site logo there. Goes live immediately.",
    schema: identitySchema,
    write: true,
    run: async (a: IdentityArgs, ctx) => {
      await assertLayoutWritable(ctx);
      return writeIdentity(ctx, a as IdentityInput);
    },
  },
  {
    name: "get_site_settings",
    title: "Get site settings",
    description: "Read the site's settings: General (name, description, time zone, main language, currency), Languages (extra languages with their own pages, Google Translate widget), maintenance mode, SEO defaults (meta title and description, Search Console and Bing verification, AI training), analytics ids (GA4, Tag Manager, Meta Pixel) and the visitor colour scheme. Change them with update_site_settings.",
    schema: z.object({}),
    write: false,
    run: async (_a: Record<string, never>, ctx) => {
      const [{ data: s }, { data: idn }] = await Promise.all([
        ctx.supabase.from("site_settings").select("*").eq("tenant_id", ctx.tenantId).maybeSingle(),
        ctx.supabase.from("site_identity").select("site_name").eq("tenant_id", ctx.tenantId).maybeSingle(),
      ]);
      const r = (s ?? {}) as Record<string, unknown>;
      const v = <T,>(k: string, d: T) => (r[k] === undefined || r[k] === null ? d : (r[k] as T));
      const css = (r.custom_css as string | null) ?? "";
      return {
        site_name: ((idn?.site_name as string | null) || (r.site_name as string | null)) ?? null,
        site_description: v("site_description", ""),
        timezone: v("timezone", "UTC"),
        language: v("language", "en"),
        site_languages: v<string[]>("site_languages", []),
        auto_translate_enabled: v("auto_translate_enabled", false),
        currency: v("currency", "USD"),
        currency_symbol: v("currency_symbol", "$"),
        currency_position: v("currency_position", "before"),
        maintenance_mode: v("maintenance_mode", false),
        maintenance_title: v<string | null>("maintenance_title", null),
        maintenance_message: v<string | null>("maintenance_message", null),
        meta_title: v<string | null>("meta_title", null),
        meta_description: v<string | null>("meta_description", null),
        google_site_verification: v<string | null>("google_site_verification", null),
        bing_site_verification: v<string | null>("bing_site_verification", null),
        allow_ai_training: v("allow_ai_training", true),
        ga_measurement_id: v<string | null>("ga_measurement_id", null),
        ga_property_id: v<string | null>("ga_property_id", null),
        gtm_container_id: v<string | null>("gtm_container_id", null),
        meta_pixel_id: v<string | null>("meta_pixel_id", null),
        site_theme: v("site_theme", "system"),
        custom_js: v<string | null>("custom_js", null),
        analytics_code: v<string | null>("analytics_code", null),
        custom_css_chars: css.length,
        supported_languages: SUPPORTED_LANGUAGES,
        ...(s ? {} : { note: "No settings saved yet: these are the defaults. update_site_settings creates the record." }),
        notes: "ga_property_id is set by connecting Google Analytics in the dashboard (Analytics). Logo and favicon: update_site_identity.",
      };
    },
  },
  {
    name: "update_site_settings",
    title: "Change site settings",
    description: "Change the site's settings; only the fields passed change, null clears one. General: site_name (kept the same in Site Identity), site_description, timezone (IANA name), language (main language), currency (code; the symbol follows) and currency_position. Languages: site_languages (extra languages with their own translated pages) and auto_translate_enabled (the Google Translate widget, only without extra languages). Maintenance: maintenance_mode, maintenance_title, maintenance_message. SEO: meta_title, meta_description, google_site_verification and bing_site_verification (the pasted meta tag or code), allow_ai_training. Analytics: ga_measurement_id, gtm_container_id, meta_pixel_id (bare id or pasted snippet). Appearance: site_theme. Same checks as the dashboard. Goes live immediately.",
    schema: settingsSchema,
    write: true,
    run: async (a: SettingsArgs, ctx) => {
      const { site_name, ...rest } = a;
      if (site_name === undefined && !Object.values(rest).some((v) => v !== undefined)) fail("Nothing to change. Pass at least one setting.");
      const { data: cur } = await ctx.supabase.from("site_settings").select("language, site_languages, auto_translate_enabled").eq("tenant_id", ctx.tenantId).maybeSingle();
      const { patch, notes } = buildSettingsPatch((cur ?? {}) as CurrentSettings, rest as SettingsInput);
      const updated = Object.keys(patch);
      if (site_name !== undefined) {
        // The name lives in Site Identity too, which is layout on a locked site.
        await assertLayoutWritable(ctx);
        await writeIdentity(ctx, { site_name });
        updated.unshift("site_name");
      }
      if (Object.keys(patch).length) {
        const { error } = await ctx.supabase.from("site_settings").upsert({ tenant_id: ctx.tenantId, ...patch, updated_at: new Date().toISOString() }, { onConflict: "tenant_id" });
        if (error) fail(error.message);
      }
      invalidateSiteCache(ctx.tenantId);
      return { updated, ...(patch.currency ? { currency_symbol: patch.currency_symbol } : {}), ...(notes.length ? { notes } : {}) };
    },
  },
];
