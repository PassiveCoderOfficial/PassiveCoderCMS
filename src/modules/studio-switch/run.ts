/**
 * "Switch to Studio" against the database (menus P5). Shared by the owner
 * API (/api/studio-switch), the staff batch tool (/api/super-admin/studio-
 * switch) and the MCP switch_to_studio tool. Takes a Supabase client and a
 * tenant id (callers check who may act first); needs no Next.js runtime, so
 * the MCP tests run it against a fake client.
 *
 * Writes only:
 * - a new nav_menus row "Main menu" (location "none", with a history
 *   version) when the classic header has its own links that no saved menu
 *   holds, and the same for a footer column of more than 12 links;
 * - site_identity.header_studio / footer_studio: the DRAFT and `switched`.
 * The classic global_header / global_footer are never written. Nothing goes
 * live until publishSwitch (an explicit Publish).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { NavItem } from "@/types/cms";
import { upsertSiteIdentity } from "@/lib/site/global-layout";
import { visibleSocials } from "@/lib/social-links";
import { recordNewMenu, type MenuRow } from "@/modules/navigation/menu-versions";
import { defaultMenuItems, toDefaultMenuPages } from "@/modules/navigation/default-menu";
import * as HDoc from "@/modules/header-studio/doc";
import * as FDoc from "@/modules/footer-studio/doc";
import { convertClassicHeader, type HeaderConversion } from "./header-convert";
import { convertClassicFooter, type FooterConversion } from "./footer-convert";
import { footerFidelity, headerFidelity, type FidelityResult, type SiteBits } from "./fidelity";
import { prepareDocs, publishSwitchedFooter, publishSwitchedHeader } from "./prepare";
import type { SavedMenu } from "./menu-match";
import type { SwitchOrigin } from "./types";

export type SwitchArea = "header" | "footer";

export interface SwitchSite {
  tenantId: string;
  siteName: string;
  logoUrl: string | null;
  logoDarkUrl: string | null;
  globalHeader: unknown;
  globalFooter: unknown;
  menus: SavedMenu[];
  headerDoc: HDoc.HeaderStudioDoc;
  footerDoc: FDoc.FooterStudioDoc;
  /** False when the studio columns are missing (migrations 240/241). */
  studioReady: boolean;
  bits: SiteBits;
}

export async function loadSwitchSite(db: SupabaseClient, tenantId: string): Promise<SwitchSite> {
  const [identityRes, studioRes, menusRes, pagesRes, profileRes] = await Promise.all([
    db.from("site_identity").select("site_name, logo_url, logo_dark_url, global_header, global_footer").eq("tenant_id", tenantId).maybeSingle(),
    // Own query: without migrations 240/241 only the studios are unavailable.
    db.from("site_identity").select("header_studio, footer_studio").eq("tenant_id", tenantId).maybeSingle(),
    db.from("nav_menus").select("id, name, location, items").eq("tenant_id", tenantId),
    db.from("pages").select("id, slug, title, type, parent_id, order_index, seo").eq("tenant_id", tenantId).eq("status", "published").is("deleted_at", null).limit(300),
    db.from("tenant_business_profiles").select("social_links").eq("tenant_id", tenantId).maybeSingle(),
  ]);
  const id = (identityRes.data ?? {}) as { site_name?: string | null; logo_url?: string | null; logo_dark_url?: string | null; global_header?: unknown; global_footer?: unknown };
  const st = (studioRes.data ?? {}) as { header_studio?: unknown; footer_studio?: unknown };
  let siteName = id.site_name ?? "";
  if (!siteName) {
    const { data: s } = await db.from("site_settings").select("site_name").eq("tenant_id", tenantId).maybeSingle();
    siteName = ((s as { site_name?: string } | null)?.site_name) ?? "";
  }
  const menus = ((menusRes.data ?? []) as SavedMenu[]);
  const pages = toDefaultMenuPages((pagesRes.data ?? []) as Parameters<typeof toDefaultMenuPages>[0]);
  return {
    tenantId, siteName,
    logoUrl: id.logo_url ?? null, logoDarkUrl: id.logo_dark_url ?? null,
    globalHeader: id.global_header ?? null, globalFooter: id.global_footer ?? null,
    menus,
    headerDoc: HDoc.normalizeDoc(studioRes.error ? null : st.header_studio),
    footerDoc: FDoc.normalizeDoc(studioRes.error ? null : st.footer_studio),
    studioReady: !studioRes.error,
    bits: {
      menus, identityLogo: id.logo_url ?? null, identityLogoDark: id.logo_dark_url ?? null, siteName,
      siteSocials: profileRes.error ? [] : visibleSocials((profileRes.data as { social_links?: unknown } | null)?.social_links).map((x) => x.url),
      defaultItems: defaultMenuItems(pages) as NavItem[],
    },
  };
}

export interface AreaPreview<C> {
  conversion: C;
  fidelity: FidelityResult;
  /** Where the site is now: classic (nothing prepared), draft (prepared, not live), studio (live). */
  state: "classic" | "draft" | "studio";
  /** The draft has edits that did not come from a switch (an owner was already working in the Studio). */
  ownDraft: boolean;
  switched: SwitchOrigin | null;
}

export interface SwitchPreview {
  site: SwitchSite;
  header: AreaPreview<HeaderConversion>;
  footer: AreaPreview<FooterConversion>;
}

function stateOf(doc: { enabled: boolean; published: unknown; draft: unknown; switched?: SwitchOrigin }): "classic" | "draft" | "studio" {
  if (doc.enabled && doc.published) return "studio";
  return doc.switched && doc.draft ? "draft" : "classic";
}

/** Converts both areas in memory. Writes nothing. */
export function previewFromSite(site: SwitchSite): SwitchPreview {
  const h = convertClassicHeader({ globalHeader: site.globalHeader, menus: site.menus, identityLogo: site.logoUrl, identityLogoDark: site.logoDarkUrl, siteName: site.siteName });
  const f = convertClassicFooter({ globalFooter: site.globalFooter, menus: site.menus, identityLogo: site.logoUrl, siteName: site.siteName });
  return {
    site,
    header: {
      conversion: h, fidelity: headerFidelity(site.globalHeader, h, site.bits), state: stateOf(site.headerDoc),
      ownDraft: !site.headerDoc.switched && !!(site.headerDoc.draft || site.headerDoc.published), switched: site.headerDoc.switched ?? null,
    },
    footer: {
      conversion: f, fidelity: footerFidelity(site.globalFooter, f, site.bits), state: stateOf(site.footerDoc),
      ownDraft: !site.footerDoc.switched && !!(site.footerDoc.draft || site.footerDoc.published), switched: site.footerDoc.switched ?? null,
    },
  };
}

export async function previewSwitch(db: SupabaseClient, tenantId: string): Promise<SwitchPreview> {
  return previewFromSite(await loadSwitchSite(db, tenantId));
}

export interface PrepareResult {
  ok: boolean;
  /** Per area: prepared, or why not. */
  header?: { prepared: boolean; reason?: string; level?: string; createdMenus?: string[] };
  footer?: { prepared: boolean; reason?: string; level?: string; createdMenus?: string[] };
  error?: string;
}

/** Why an area cannot be prepared right now (null = it can). */
export function blockedReason(a: AreaPreview<HeaderConversion | FooterConversion>, replace: boolean): string | null {
  if (a.state === "studio") return "already_studio";
  if (a.conversion.level === "unsupported") return "cannot_convert";
  if (a.ownDraft && !replace) return "own_draft";
  return null;
}

/**
 * Converts the chosen areas and saves them as Studio drafts (plus the menus
 * they need). `replace` = overwrite a Studio draft the owner was already
 * working on (refused otherwise). Never publishes.
 */
export async function prepareSwitch(
  db: SupabaseClient,
  tenantId: string,
  opts: { areas: SwitchArea[]; via: SwitchOrigin["via"]; userId: string | null; replace?: boolean },
): Promise<PrepareResult> {
  const pv = await previewSwitch(db, tenantId);
  if (!pv.site.studioReady) return { ok: false, error: "The Studio is not switched on for this database yet (migrations 240 and 241)." };
  const out: PrepareResult = { ok: true };
  const want = new Set(opts.areas);
  const hBlock = want.has("header") ? blockedReason(pv.header, !!opts.replace) : "not_asked";
  const fBlock = want.has("footer") ? blockedReason(pv.footer, !!opts.replace) : "not_asked";
  if (want.has("header") && hBlock) out.header = { prepared: false, reason: hBlock };
  if (want.has("footer") && fBlock) out.footer = { prepared: false, reason: fBlock };

  // Menus the drafts need, created first (location "none": no classic block can pick them up).
  const ids: Record<string, string> = {};
  const toCreate: { ref: string; name: string; items: NavItem[] }[] = [];
  if (!hBlock && pv.header.conversion.menu?.kind === "new") toCreate.push(pv.header.conversion.menu);
  if (!fBlock) toCreate.push(...pv.footer.conversion.newMenus);
  for (const m of toCreate) {
    const slug = `${m.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "menu"}-${Math.random().toString(36).slice(2, 6)}`;
    const { data, error } = await db.from("nav_menus")
      .insert({ tenant_id: tenantId, template_id: null, name: m.name, slug, location: "none", items: m.items })
      .select("*").single();
    if (error || !data) return { ok: false, error: `The menu "${m.name}" could not be created: ${error?.message ?? "no row"}` };
    ids[m.ref] = (data as { id: string }).id;
    await recordNewMenu(db, data as MenuRow, opts.userId, "import");
  }

  const prepared = prepareDocs({
    header: hBlock ? null : pv.header.conversion,
    footer: fBlock ? null : pv.footer.conversion,
    headerDoc: pv.site.headerDoc, footerDoc: pv.site.footerDoc,
    menuIds: (ref) => ids[ref],
    origin: { at: new Date().toISOString(), by: opts.userId, via: opts.via },
  });
  const patch: Record<string, unknown> = {};
  if (prepared.headerDoc) patch.header_studio = prepared.headerDoc;
  if (prepared.footerDoc) patch.footer_studio = prepared.footerDoc;
  if (Object.keys(patch).length) {
    const error = await upsertSiteIdentity(db, tenantId, patch);
    if (error) return { ok: false, error };
  }
  if (prepared.headerDoc) out.header = { prepared: true, level: prepared.headerDoc.switched?.level, createdMenus: prepared.headerDoc.switched?.createdMenus };
  if (prepared.footerDoc) out.footer = { prepared: true, level: prepared.footerDoc.switched?.level, createdMenus: prepared.footerDoc.switched?.createdMenus };
  return out;
}

/** Publishes prepared switches (only areas whose draft came from a switch). */
export async function publishSwitch(db: SupabaseClient, tenantId: string, opts: { areas: SwitchArea[]; userId: string | null }): Promise<{ ok: boolean; published: SwitchArea[]; skipped: { area: SwitchArea; reason: string }[]; error?: string }> {
  const site = await loadSwitchSite(db, tenantId);
  const patch: Record<string, unknown> = {};
  const published: SwitchArea[] = [];
  const skipped: { area: SwitchArea; reason: string }[] = [];
  for (const area of opts.areas) {
    const doc = area === "header" ? site.headerDoc : site.footerDoc;
    const pending = area === "header" ? HDoc.hasUnpublishedChanges(site.headerDoc) : FDoc.hasUnpublishedChanges(site.footerDoc);
    if (doc.enabled && doc.published && !pending) { skipped.push({ area, reason: "already_studio" }); continue; }
    const next = area === "header" ? publishSwitchedHeader(site.headerDoc, opts.userId) : publishSwitchedFooter(site.footerDoc, opts.userId);
    if (!next) { skipped.push({ area, reason: "not_prepared" }); continue; }
    patch[area === "header" ? "header_studio" : "footer_studio"] = next;
    published.push(area);
  }
  if (Object.keys(patch).length) {
    const error = await upsertSiteIdentity(db, tenantId, patch);
    if (error) return { ok: false, published: [], skipped, error };
  }
  return { ok: true, published, skipped };
}

/**
 * "Switch back": a live switched Studio goes back to the classic one (Studio
 * data kept, one click to return); a prepared draft that never went live is
 * dropped. The classic data was never touched either way.
 */
export async function switchBack(db: SupabaseClient, tenantId: string, area: SwitchArea): Promise<{ ok: boolean; result: "classic" | "discarded" | "nothing"; error?: string }> {
  const site = await loadSwitchSite(db, tenantId);
  if (area === "header") {
    const d = site.headerDoc;
    const next = d.enabled && d.published ? HDoc.switchToClassic(d) : d.switched && !d.published ? HDoc.discardDraft(d) : null;
    if (!next) return { ok: true, result: "nothing" };
    const error = await upsertSiteIdentity(db, tenantId, { header_studio: next });
    return error ? { ok: false, result: "nothing", error } : { ok: true, result: d.enabled ? "classic" : "discarded" };
  }
  const d = site.footerDoc;
  const next = d.enabled && d.published ? FDoc.switchToClassic(d) : d.switched && !d.published ? FDoc.discardDraft(d) : null;
  if (!next) return { ok: true, result: "nothing" };
  const error = await upsertSiteIdentity(db, tenantId, { footer_studio: next });
  return error ? { ok: false, result: "nothing", error } : { ok: true, result: d.enabled ? "classic" : "discarded" };
}
