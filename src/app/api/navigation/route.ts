/**
 * Navigation menus — list, create, update, delete.
 *
 * Menus are the source of truth for nav DATA; the navigation block handles
 * presentation and points at a menu by location. Keeping them apart is what
 * lets the same menu appear in the header and the footer without two copies
 * drifting from each other.
 */
import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { getCurrentTenantId } from "@/lib/tenant/current";
import type { NavItem } from "@/types/cms";

const VALID_LOCATIONS = ["none", "header", "footer", "footer_secondary", "mobile", "sidebar", "legal"];

async function requireTenantAccess() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const tenantId = await getCurrentTenantId();
  if (!tenantId) return null;

  const admin = await createAdminClient();
  const { data: sa } = await admin.from("super_admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (sa) return { tenantId, admin };

  const { data: membership } = await supabase
    .from("tenant_members").select("role").eq("tenant_id", tenantId).eq("user_id", user.id).maybeSingle();
  if (!membership || !["owner", "admin", "editor"].includes(membership.role as string)) return null;

  return { tenantId, admin };
}

export async function GET() {
  const ctx = await requireTenantAccess();
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await ctx.admin
    .from("nav_menus")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .order("location", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ menus: data ?? [] });
}

export async function POST(req: Request) {
  const ctx = await requireTenantAccess();
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json() as { name?: string; location?: string; items?: NavItem[] };
  const name = (body.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "Menu name is required" }, { status: 400 });

  const location = body.location ?? "none";
  if (!VALID_LOCATIONS.includes(location)) {
    return NextResponse.json({ error: `Unknown location "${location}"` }, { status: 400 });
  }

  // One menu per location — tell the caller which menu is in the way rather
  // than surfacing a raw unique-constraint error.
  if (location !== "none") {
    const { data: clash } = await ctx.admin
      .from("nav_menus").select("id, name").eq("tenant_id", ctx.tenantId).eq("location", location).maybeSingle();
    if (clash) {
      return NextResponse.json(
        { error: `"${clash.name}" is already assigned to ${location.replace("_", " ")}. Move it first, or create this menu unassigned.` },
        { status: 409 },
      );
    }
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "menu";

  const { data, error } = await ctx.admin
    .from("nav_menus")
    .insert({ tenant_id: ctx.tenantId, template_id: null, name, slug, location, items: body.items ?? [] })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ menu: data });
}

export async function PATCH(req: Request) {
  const ctx = await requireTenantAccess();
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json() as { id?: string; name?: string; location?: string; items?: NavItem[] };
  if (!body.id) return NextResponse.json({ error: "Menu id is required" }, { status: 400 });

  const { data: existing } = await ctx.admin
    .from("nav_menus").select("id").eq("id", body.id).eq("tenant_id", ctx.tenantId).maybeSingle();
  if (!existing) return NextResponse.json({ error: "Menu not found" }, { status: 404 });

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.name?.trim()) {
    patch.name = body.name.trim();
    patch.slug = body.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }
  if (body.items) patch.items = body.items;

  if (body.location !== undefined) {
    if (!VALID_LOCATIONS.includes(body.location)) {
      return NextResponse.json({ error: `Unknown location "${body.location}"` }, { status: 400 });
    }
    // Moving a menu into an occupied slot would hit the unique index — free it
    // by unassigning the incumbent, which is what the user visibly intends.
    if (body.location !== "none") {
      await ctx.admin
        .from("nav_menus")
        .update({ location: "none", updated_at: new Date().toISOString() })
        .eq("tenant_id", ctx.tenantId)
        .eq("location", body.location)
        .neq("id", body.id);
    }
    patch.location = body.location;
  }

  const { data, error } = await ctx.admin
    .from("nav_menus").update(patch).eq("id", body.id).select("*").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ menu: data });
}

export async function DELETE(req: Request) {
  const ctx = await requireTenantAccess();
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Menu id is required" }, { status: 400 });

  const { error } = await ctx.admin
    .from("nav_menus").delete().eq("id", id).eq("tenant_id", ctx.tenantId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
