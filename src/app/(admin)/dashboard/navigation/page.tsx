import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentTenantId } from "@/lib/tenant/current";
import NavigationClient from "./navigation-client";
import type { NavMenuRow, ImportableNav } from "./navigation-client";
import type { Block, NavigationBlockProps } from "@/types/cms";

function findInlineNav(blocks: unknown, location: "header" | "footer"): ImportableNav | null {
  const arr = Array.isArray(blocks) ? (blocks as Block[]) : [];
  const nav = arr.find((b): b is NavigationBlockProps => b.type === "navigation");
  if (!nav) return null;
  // Already reading from a managed menu — nothing to import, this location is
  // already the case the rest of the page handles.
  if (nav.data.menuLocation) return null;
  if (!nav.data.items?.length) return null;
  return { location, items: nav.data.items };
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
  const [{ data: menus }, { data: identity }] = await Promise.all([
    admin.from("nav_menus").select("*").eq("tenant_id", tenantId).order("location", { ascending: true }),
    admin.from("site_identity").select("global_header, global_footer").eq("tenant_id", tenantId).maybeSingle(),
  ]);

  // A menu built through the Header/Footer Builder lives inline on the
  // navigation block itself (data.items) until it's explicitly pointed at a
  // managed menu (data.menuLocation) — the common case for any site whose nav
  // was authored there rather than here. Without this, a tenant with a fully
  // working header nav sees "No menus yet", because nothing in it ever
  // touched nav_menus.
  const takenLocations = new Set((menus ?? []).map((m) => m.location as string));
  const importable = [
    findInlineNav(identity?.global_header, "header"),
    findInlineNav(identity?.global_footer, "footer"),
  ].filter((x): x is ImportableNav => x !== null && !takenLocations.has(x.location));

  return <NavigationClient initialMenus={(menus ?? []) as NavMenuRow[]} importable={importable} />;
}
