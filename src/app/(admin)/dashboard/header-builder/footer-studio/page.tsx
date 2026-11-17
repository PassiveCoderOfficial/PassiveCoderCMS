import { createAdminClient } from "@/lib/supabase/server";
import { styleText } from "@/lib/security/style-text";
import { getCurrentTenantId } from "@/lib/tenant/current";
import { getSiteContact } from "@/lib/site-contact";
import { resolveEnabledModules } from "@/lib/modules/resolve-modules";
import { resolveDbTemplateIdentity } from "@/modules/templates/resolve-identity";
import { buildSiteTheme, type SiteThemeInput } from "@/modules/themes/site-theme";
import { expandDynamicChildren } from "@/modules/navigation/dynamic-children";
import { classicHeaderItems } from "@/modules/header-studio/classic-links";
import { normalizeMenu } from "@/modules/navigation/menu-model";
import { normalizeDoc } from "@/modules/footer-studio/doc";
import { pickFooterMenu, pagesAsItems, type MenuRow } from "@/modules/footer-studio/menus";
import type { FooterFacts } from "@/modules/footer-studio/presets";
import type { NavItem } from "@/types/cms";
import FooterStudioClient, { type StudioMenu } from "./studio-client";

/** Legal pages offered as bottom-bar links by the presets, when the site has them. */
const LEGAL_SLUGS = ["privacy", "privacy-policy", "terms", "terms-and-conditions", "terms-of-service", "refund", "refund-policy", "cookie-policy"];

/**
 * Footer Studio (Header & Footer Studio phase 3): preset gallery, widget
 * columns and bottom bar, phone accordions, live preview, draft / publish /
 * history. Lives inside the Header Builder area
 * (/dashboard/header-builder/footer-studio), so the layout lock covers it
 * like the rest of the header / footer builder.
 */
export default async function FooterStudioPage() {
  const tenantId = await getCurrentTenantId();
  if (!tenantId) return <div className="p-6"><p className="text-sm text-muted-foreground">No site selected.</p></div>;

  const admin = await createAdminClient();
  const [identityRes, studioRes, menusRes, pagesRes, contact, modules, profileRes, mapRes] = await Promise.all([
    admin.from("site_identity").select("site_name, logo_url, logo_dark_url, template_id, color_overrides, design_overrides, global_header").eq("tenant_id", tenantId).maybeSingle(),
    // Own query: without migration 241 only the studio is unavailable.
    admin.from("site_identity").select("footer_studio").eq("tenant_id", tenantId).maybeSingle(),
    admin.from("nav_menus").select("id, name, location, items").eq("tenant_id", tenantId).order("created_at"),
    admin.from("pages").select("slug, title").eq("tenant_id", tenantId).eq("status", "published").is("deleted_at", null).neq("type", "post").order("created_at").limit(200),
    getSiteContact(tenantId),
    resolveEnabledModules(tenantId).catch(() => null),
    admin.from("tenant_business_profiles").select("opening_hours").eq("tenant_id", tenantId).maybeSingle(),
    admin.from("contact_details").select("maps_embed_url").eq("tenant_id", tenantId).order("is_primary", { ascending: false }).order("sort_order", { ascending: true }).limit(1).maybeSingle(),
  ]);
  const identity = identityRes.data as (SiteThemeInput & { site_name?: string | null; logo_url?: string | null; logo_dark_url?: string | null; template_id?: string | null; global_header?: unknown }) | null;
  const unavailable = !!studioRes.error;
  const doc = normalizeDoc(studioRes.error ? null : (studioRes.data as { footer_studio?: unknown } | null)?.footer_studio);

  const rows = (menusRes.data ?? []) as (MenuRow & { name: string | null })[];
  const menus: StudioMenu[] = await Promise.all(rows.map(async (m) => ({
    id: m.id, name: m.name || m.location || "Menu", location: m.location,
    items: await expandDynamicChildren(admin, tenantId, normalizeMenu(m.items)) as NavItem[],
  })));
  // What a menu widget with no menu of its own shows (same rule as the live site).
  const pageRows = (pagesRes.data ?? []) as { slug: string; title: string | null }[];
  const fallback = pickFooterMenu(rows, "", classicHeaderItems(identity?.global_header), pagesAsItems(pageRows.filter((p) => !p.slug.includes("/"))));
  const defaultItems = await expandDynamicChildren(admin, tenantId, fallback) as NavItem[];

  let siteName = identity?.site_name ?? "";
  if (!siteName) {
    const { data: s } = await admin.from("site_settings").select("site_name").eq("tenant_id", tenantId).maybeSingle();
    siteName = (s?.site_name as string | undefined) ?? "";
  }

  const hoursRaw = (profileRes.error ? null : (profileRes.data as { opening_hours?: unknown } | null)?.opening_hours);
  const hours = typeof hoursRaw === "string" && hoursRaw.trim() ? hoursRaw.trim() : null;
  const mapRaw = (mapRes.data as { maps_embed_url?: unknown } | null)?.maps_embed_url;
  const siteMap = typeof mapRaw === "string" && mapRaw.trim() ? mapRaw.trim() : null;

  const legal = LEGAL_SLUGS
    .map((slug) => pageRows.find((p) => p.slug === slug))
    .filter((p): p is { slug: string; title: string | null } => !!p)
    .map((p) => ({ label: p.title || p.slug, url: `/${p.slug}` }));

  const facts: FooterFacts = {
    phone: contact?.phone ?? null,
    whatsapp: contact?.whatsapp ?? null,
    email: contact?.email ?? null,
    address: contact?.address ?? null,
    socials: contact?.socials?.length ?? 0,
    hours: !!hours,
    map: !!(siteMap || contact?.address),
    shop: !!modules?.ecommerce,
    booking: !!modules?.bookings,
    legal,
  };

  // Brand palette on the preview only (same scoping as the header studio).
  const templateIdentity = identity?.template_id ? await resolveDbTemplateIdentity(identity.template_id) : null;
  const { css: templateCSSVars } = buildSiteTheme(identity, templateIdentity, ".cms-canvas-light");
  const templateCustomCss = templateIdentity?.customCss ?? null;

  return (
    <>
      <style precedence="pc-template" dangerouslySetInnerHTML={{ __html: templateCSSVars }} />
      {templateCustomCss && <style precedence="pc-template-css" dangerouslySetInnerHTML={{ __html: styleText(templateCustomCss) }} />}
      <FooterStudioClient
        initialDoc={doc}
        unavailable={unavailable}
        menus={menus}
        defaultItems={defaultItems}
        facts={facts}
        contact={contact}
        hours={hours}
        siteMap={siteMap}
        tenantId={tenantId}
        logoUrl={identity?.logo_url ?? null}
        logoDarkUrl={identity?.logo_dark_url ?? null}
        siteName={siteName}
      />
    </>
  );
}
