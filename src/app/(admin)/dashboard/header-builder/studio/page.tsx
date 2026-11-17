import { createAdminClient } from "@/lib/supabase/server";
import { styleText } from "@/lib/security/style-text";
import { getCurrentTenantId } from "@/lib/tenant/current";
import { getSiteContact } from "@/lib/site-contact";
import { resolveEnabledModules } from "@/lib/modules/resolve-modules";
import { resolveDbTemplateIdentity } from "@/modules/templates/resolve-identity";
import { buildSiteTheme, type SiteThemeInput } from "@/modules/themes/site-theme";
import { expandDynamicChildren } from "@/modules/navigation/dynamic-children";
import { classicHeaderItems } from "@/modules/header-studio/classic-links";
import { getDefaultMenu } from "@/lib/site/default-menu";
import { normalizeMenu } from "@/modules/navigation/menu-model";
import { normalizeDoc } from "@/modules/header-studio/doc";
import type { SiteFacts } from "@/modules/header-studio/presets";
import type { NavItem } from "@/types/cms";
import HeaderStudioClient, { type StudioMenu } from "./studio-client";

/**
 * Header Studio (Header & Footer Studio phase 2): preset gallery, rows and
 * zones, phone layout, behaviour, live preview, draft / publish / history.
 * Lives inside the Header Builder area (/dashboard/header-builder/studio),
 * so the layout lock covers it like the rest of the header builder.
 */
export default async function HeaderStudioPage() {
  const tenantId = await getCurrentTenantId();
  if (!tenantId) return <div className="p-6"><p className="text-sm text-muted-foreground">No site selected.</p></div>;

  const admin = await createAdminClient();
  const [identityRes, studioRes, menusRes, pagesRes, contact, modules] = await Promise.all([
    admin.from("site_identity").select("site_name, logo_url, logo_dark_url, template_id, color_overrides, design_overrides, global_header").eq("tenant_id", tenantId).maybeSingle(),
    // Own query: without migration 240 only the studio is unavailable.
    admin.from("site_identity").select("header_studio").eq("tenant_id", tenantId).maybeSingle(),
    admin.from("nav_menus").select("id, name, location, items").eq("tenant_id", tenantId).order("created_at"),
    admin.from("pages").select("slug, title").eq("tenant_id", tenantId).eq("status", "published").is("deleted_at", null).neq("type", "post").order("title").limit(200),
    getSiteContact(tenantId),
    resolveEnabledModules(tenantId).catch(() => null),
  ]);
  const identity = identityRes.data as (SiteThemeInput & { site_name?: string | null; logo_url?: string | null; logo_dark_url?: string | null; template_id?: string | null }) | null;
  const unavailable = !!studioRes.error;
  const doc = normalizeDoc(studioRes.error ? null : (studioRes.data as { header_studio?: unknown } | null)?.header_studio);

  // Every menu, expanded the way the site will show it, for the live preview.
  const menus: StudioMenu[] = await Promise.all(((menusRes.data ?? []) as { id: string; name: string | null; location: string | null; items: unknown }[]).map(async (m) => ({
    id: m.id, name: m.name || m.location || "Menu", location: m.location,
    items: await expandDynamicChildren(admin, tenantId, normalizeMenu(m.items)) as NavItem[],
  })));

  // The classic header's links: what the menu shows when no saved menu is in the header.
  const classic = classicHeaderItems((identityRes.data as { global_header?: unknown } | null)?.global_header);
  const classicItems = classic ? await expandDynamicChildren(admin, tenantId, classic) as NavItem[] : null;
  // Nothing at all: the automatic menu from the site's pages (menus P3).
  const defaultItems = !classicItems && !(menusRes.data ?? []).length ? await getDefaultMenu(tenantId) : [];

  let siteName = identity?.site_name ?? "";
  if (!siteName) {
    const { data: s } = await admin.from("site_settings").select("site_name").eq("tenant_id", tenantId).maybeSingle();
    siteName = (s?.site_name as string | undefined) ?? "";
  }

  const facts: SiteFacts = {
    phone: contact?.phone ?? null,
    whatsapp: contact?.whatsapp ?? null,
    email: contact?.email ?? null,
    socials: contact?.socials?.length ?? 0,
    shop: !!modules?.ecommerce,
    booking: !!modules?.bookings,
  };

  // Brand palette on the preview only (same scoping as the header builder).
  const templateIdentity = identity?.template_id ? await resolveDbTemplateIdentity(identity.template_id) : null;
  const { css: templateCSSVars } = buildSiteTheme(identity, templateIdentity, ".cms-canvas-light");
  const templateCustomCss = templateIdentity?.customCss ?? null;

  return (
    <>
      <style precedence="pc-template" dangerouslySetInnerHTML={{ __html: templateCSSVars }} />
      {templateCustomCss && <style precedence="pc-template-css" dangerouslySetInnerHTML={{ __html: styleText(templateCustomCss) }} />}
      <HeaderStudioClient
        initialDoc={doc}
        unavailable={unavailable}
        menus={menus}
        classicItems={classicItems}
        defaultItems={defaultItems}
        pages={((pagesRes.data ?? []) as { slug: string; title: string | null }[]).map((p) => ({ path: p.slug === "home" ? "/" : `/${p.slug}`, title: p.title || p.slug }))}
        facts={facts}
        contact={contact}
        logoUrl={identity?.logo_url ?? null}
        logoDarkUrl={identity?.logo_dark_url ?? null}
        siteName={siteName}
      />
    </>
  );
}
