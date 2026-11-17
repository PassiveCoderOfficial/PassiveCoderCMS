import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentTenantId } from "@/lib/tenant/current";
import NavigationClient from "./navigation-client";
import type { NavMenuRow, ImportableNav } from "./navigation-client";
import { normalizeMenu } from "@/modules/navigation/menu-model";
import { findImportableNav } from "@/modules/navigation/nav-blocks";
import { menuReaders } from "@/modules/navigation/menu-usage";
import { resolveLiveHeader } from "@/modules/header-studio/doc";
import { menuRefs } from "@/modules/header-studio/model";
import { resolveLiveFooter } from "@/modules/footer-studio/doc";
import { footerMenuRefs } from "@/modules/footer-studio/model";

/**
 * Links a header/footer shows from its own block (no saved menu behind them),
 * offered as a one-click import. Finds menu blocks at any depth, so container
 * headers (header_nav inside a column) are offered too, and blocks that point
 * at a location with no saved menu yet (they show their own links).
 */
function findInlineNav(blocks: unknown, location: "header" | "footer", savedLocations: Set<string>): ImportableNav | null {
  const hit = findImportableNav(blocks, savedLocations);
  if (!hit) return null;
  // A block pointing at some other missing location: not this slot's menu.
  if (hit.pointsAt && hit.pointsAt !== location) return null;
  return { location, items: normalizeMenu(hit.items), ...(hit.pointsAt ? { missingMenu: true } : {}) };
}

export default async function NavigationPage() {
  const tenantId = await getCurrentTenantId();
  if (!tenantId) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">No site selected.</p>
      </div>
    );
  }

  const admin = await createAdminClient();
  const [{ data: menus }, { data: identity }, { data: pages }, { data: studios }] = await Promise.all([
    admin.from("nav_menus").select("*").eq("tenant_id", tenantId).order("location", { ascending: true }),
    admin.from("site_identity").select("global_header, global_footer, global_prefooter").eq("tenant_id", tenantId).maybeSingle(),
    // Pages can carry their own header copy (translations, imports), which
    // may read a saved menu: counted for "where is this menu shown".
    admin.from("pages").select("blocks").eq("tenant_id", tenantId).eq("status", "published").is("deleted_at", null).limit(400),
    // Own query: the studio columns may be missing (migrations 240/241), which only means "classic".
    admin.from("site_identity").select("header_studio, footer_studio").eq("tenant_id", tenantId).maybeSingle().then((r) => r, () => ({ data: null })),
  ]);

  // A menu built through the Header/Footer Builder lives inline on the
  // navigation block itself (data.items) until it's explicitly pointed at a
  // managed menu (data.menuLocation) — the common case for any site whose nav
  // was authored there rather than here. Without this, a tenant with a fully
  // working header nav sees "No menus yet", because nothing in it ever
  // touched nav_menus.
  const takenLocations = new Set((menus ?? []).map((m) => m.location as string));
  const importable = [
    findInlineNav(identity?.global_header, "header", takenLocations),
    findInlineNav(identity?.global_footer, "footer", takenLocations),
  ].filter((x): x is ImportableNav => x !== null && !takenLocations.has(x.location));

  const liveHeader = resolveLiveHeader((studios as { header_studio?: unknown } | null)?.header_studio);
  const liveFooter = resolveLiveFooter((studios as { footer_studio?: unknown } | null)?.footer_studio);
  const readers = menuReaders({
    classicHeader: identity?.global_header,
    classicFooter: identity?.global_footer,
    classicPrefooter: (identity as { global_prefooter?: unknown } | null)?.global_prefooter,
    pages: (pages ?? []).map((p) => (p as { blocks?: unknown }).blocks),
    studioHeaderRefs: liveHeader ? menuRefs(liveHeader) : null,
    studioFooterRefs: liveFooter ? footerMenuRefs(liveFooter) : null,
  });

  const rows = ((menus ?? []) as NavMenuRow[]).map((m) => ({ ...m, items: normalizeMenu(m.items) }));
  return <NavigationClient initialMenus={rows} importable={importable} readers={readers} />;
}
