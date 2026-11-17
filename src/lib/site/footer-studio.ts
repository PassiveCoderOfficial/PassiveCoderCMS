import "server-only";
import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/server";
import { expandDynamicChildren } from "@/modules/navigation/dynamic-children";
import { classicHeaderItems } from "@/modules/header-studio/classic-links";
import { resolveLiveFooter } from "@/modules/footer-studio/doc";
import { footerMenuRefs, usesHours, type FooterConfig } from "@/modules/footer-studio/model";
import { pickFooterMenu, pagesAsItems, type MenuRow } from "@/modules/footer-studio/menus";
import type { NavItem } from "@/types/cms";

export interface StudioFooterData {
  config: FooterConfig;
  /** Menus the footer uses, by widget menuId ("" = the default footer menu), expanded. */
  menus: Record<string, NavItem[]>;
  /** Business Profile opening hours (free text), when an hours widget needs them. */
  hours: string | null;
  /** The site's saved map (Contact details), the map widget's fallback. */
  siteMap: string | null;
}

async function loadFooterMenus(tenantId: string, config: FooterConfig): Promise<Record<string, NavItem[]>> {
  const refs = footerMenuRefs(config);
  if (!refs.length) return {};
  const admin = await createAdminClient();
  const [{ data }, { data: identity }, { data: pageRows }] = await Promise.all([
    admin.from("nav_menus").select("id, location, items").eq("tenant_id", tenantId),
    admin.from("site_identity").select("global_header").eq("tenant_id", tenantId).maybeSingle(),
    admin.from("pages").select("slug, title").eq("tenant_id", tenantId).eq("status", "published").is("deleted_at", null)
      .neq("type", "post").not("slug", "like", "%/%").order("created_at").limit(20),
  ]);
  const rows = (data ?? []) as MenuRow[];
  const classic = classicHeaderItems((identity as { global_header?: unknown } | null)?.global_header);
  const pages = pagesAsItems((pageRows ?? []) as { slug: string; title: string | null }[]);
  const out: Record<string, NavItem[]> = {};
  await Promise.all(refs.map(async (ref) => {
    out[ref] = await expandDynamicChildren(admin, tenantId, pickFooterMenu(rows, ref, classic, pages));
  }));
  return out;
}

async function loadHoursAndMap(tenantId: string, config: FooterConfig): Promise<{ hours: string | null; siteMap: string | null }> {
  const admin = await createAdminClient();
  const needMap = config.columns.some((c) => c.widgets.some((w) => w.type === "map" && !w.mapEmbedUrl && !w.mapLocation));
  const [hoursRes, mapRes] = await Promise.all([
    usesHours(config)
      ? admin.from("tenant_business_profiles").select("opening_hours").eq("tenant_id", tenantId).maybeSingle().then((r) => r, () => ({ data: null }))
      : Promise.resolve({ data: null }),
    needMap
      ? admin.from("contact_details").select("maps_embed_url").eq("tenant_id", tenantId)
          .order("is_primary", { ascending: false }).order("sort_order", { ascending: true }).limit(1).maybeSingle().then((r) => r, () => ({ data: null }))
      : Promise.resolve({ data: null }),
  ]);
  const h = (hoursRes.data as { opening_hours?: unknown } | null)?.opening_hours;
  const m = (mapRes.data as { maps_embed_url?: unknown } | null)?.maps_embed_url;
  return {
    hours: typeof h === "string" && h.trim() ? h.trim() : null,
    siteMap: typeof m === "string" && m.trim() ? m.trim() : null,
  };
}

/** Menus, hours and map for a footer config (the live footer and the dashboard preview). */
export async function loadFooterExtras(tenantId: string, config: FooterConfig): Promise<Omit<StudioFooterData, "config">> {
  const [menus, extra] = await Promise.all([loadFooterMenus(tenantId, config), loadHoursAndMap(tenantId, config)]);
  return { menus, ...extra };
}

/**
 * The site's live studio footer, once per request (the layout and the page
 * share it through React cache). Null = the classic footer path: no studio
 * document, nothing published, switched back to classic, or the
 * footer_studio column not there yet (migration 241 not applied), which is
 * why this is its own query: an error here can only ever mean "classic".
 */
export const getStudioFooter = cache(async (tenantId: string | null): Promise<StudioFooterData | null> => {
  if (!tenantId) return null;
  try {
    const admin = await createAdminClient();
    const { data, error } = await admin.from("site_identity").select("footer_studio").eq("tenant_id", tenantId).maybeSingle();
    if (error || !data) return null;
    const config = resolveLiveFooter((data as { footer_studio?: unknown }).footer_studio);
    if (!config) return null;
    return { config, ...(await loadFooterExtras(tenantId, config)) };
  } catch {
    return null;
  }
});
