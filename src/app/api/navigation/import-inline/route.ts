/**
 * Promotes a header/footer's inline nav items (navigation block's own
 * data.items) into a real managed menu — the counterpart to the gap this
 * closes: a nav authored through the Header/Footer Builder lives only on that
 * block until this runs, so the Navigation manager page had nothing to show
 * for it even though the header worked fine on the live site.
 *
 * Does both halves needed for this to actually take effect, in one request:
 * 1. Creates the nav_menus row from the block's current items.
 * 2. Points the menu block(s) at it (data.menuLocation) so the header/
 *    footer switches to reading the managed copy — without this the import
 *    would just be a second copy that immediately goes stale.
 * Finds menu blocks at any depth (container headers, 2026-11-17), and blocks
 * already pointing at a location that has no saved menu yet.
 */
import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { getCurrentTenantId } from "@/lib/tenant/current";
import { checkTenantEditAccess } from "@/modules/tenant/can-edit";
import type { Block } from "@/types/cms";
import { normalizeMenu } from "@/modules/navigation/menu-model";
import { findImportableNav, pointNavBlocksAt } from "@/modules/navigation/nav-blocks";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await getCurrentTenantId();
  if (!tenantId) return NextResponse.json({ error: "No site selected" }, { status: 400 });

  const admin = await createAdminClient();
  const access = await checkTenantEditAccess(admin, tenantId, user.id);
  if (!access.allowed) {
    return NextResponse.json(
      { error: "You don't have permission to edit this site's navigation." },
      { status: 403 },
    );
  }

  const { location } = await req.json() as { location?: "header" | "footer" };
  if (location !== "header" && location !== "footer") {
    return NextResponse.json({ error: "location must be \"header\" or \"footer\"" }, { status: 400 });
  }
  const column = location === "header" ? "global_header" : "global_footer";

  const { data: identity } = await admin
    .from("site_identity")
    .select("global_header, global_footer")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  const blocks = ((identity as Record<string, Block[] | null> | null)?.[column] as Block[] | null) ?? [];
  // Any depth: container headers keep their menu in a header_nav inside a
  // column. A block pointing at this location with no saved menu there yet
  // shows its own links, so those are importable too.
  const { data: existing } = await admin.from("nav_menus").select("location").eq("tenant_id", tenantId);
  const saved = new Set(((existing ?? []) as { location: string }[]).map((m) => m.location));
  const hit = findImportableNav(blocks, saved);
  if (!hit) return NextResponse.json({ error: "No menu with its own links found" }, { status: 404 });
  if (hit.pointsAt && hit.pointsAt !== location) {
    return NextResponse.json({ error: "This menu points at another location" }, { status: 409 });
  }
  const rawItems = hit.items;
  // Cleaned like every other saved menu (ids filled, depth capped); a valid
  // legacy menu comes back unchanged, so the live header looks the same.
  const items = normalizeMenu(rawItems);
  if (items.length === 0) return NextResponse.json({ error: "Nothing to import — this menu is empty" }, { status: 400 });

  if (saved.has(location)) {
    const { data: clash } = await admin
      .from("nav_menus").select("id, name").eq("tenant_id", tenantId).eq("location", location).maybeSingle();
    return NextResponse.json(
      { error: `"${clash?.name ?? "Another menu"}" already occupies ${location}. Move or delete it first.` },
      { status: 409 },
    );
  }

  const name = location === "header" ? "Header menu" : "Footer menu";
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  const { data: menu, error: insertError } = await admin
    .from("nav_menus")
    .insert({ tenant_id: tenantId, template_id: null, name, slug, location, items })
    .select("*")
    .single();
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  // Point every copy that shows exactly these links at the new menu (a
  // container header's desktop/phone pair); a block already pointing here
  // (missing menu) needs no change.
  const { blocks: nextBlocks, count } = pointNavBlocksAt(blocks, rawItems, location);
  if (count === 0) return NextResponse.json({ menu });
  const { error: updateError } = await admin
    .from("site_identity")
    .update({ [column]: nextBlocks, updated_at: new Date().toISOString() })
    .eq("tenant_id", tenantId);
  if (updateError) {
    // The menu now exists but the block wasn't repointed — surface this
    // clearly rather than pretending the import fully succeeded.
    return NextResponse.json(
      { error: `Menu created, but the ${location} couldn't be repointed to it: ${updateError.message}`, menu },
      { status: 500 },
    );
  }

  return NextResponse.json({ menu });
}
