import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentTenantId } from "@/lib/tenant/current";
import NavigationClient from "./navigation-client";
import type { NavMenuRow, ImportableNav } from "./navigation-client";
import { normalizeMenu } from "@/modules/navigation/menu-model";
import { findImportableNav } from "@/modules/navigation/nav-blocks";
import { loadMenuReaders } from "@/lib/site/menu-readers";

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
  const [{ data: menus }, { readers, identity }] = await Promise.all([
    admin.from("nav_menus").select("*").eq("tenant_id", tenantId).order("location", { ascending: true }),
    loadMenuReaders(admin, tenantId),
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

  const rows = ((menus ?? []) as NavMenuRow[]).map((m) => ({ ...m, items: normalizeMenu(m.items) }));
  return <NavigationClient initialMenus={rows} importable={importable} readers={readers} />;
}
