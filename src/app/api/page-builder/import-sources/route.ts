/**
 * Import sources for the page editor's "Import" flow.
 *
 * Answers three questions the import UI asks in sequence:
 *   ?kind=pages&tenantId=…      → this site's other pages
 *   ?kind=templates             → templates available to import from
 *   ?kind=template-pages&id=…   → one template's pages, for the single-page picker
 */
import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { TEMPLATE_REGISTRY } from "@/modules/themes/template-registry";
import type { SiteTemplate } from "@/modules/templates/types";

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const kind = url.searchParams.get("kind");
  const admin = await createAdminClient();

  if (kind === "pages") {
    const tenantId = url.searchParams.get("tenantId");
    if (!tenantId) return NextResponse.json({ error: "tenantId required" }, { status: 400 });

    // Membership check — importing reads another page's content, so it must
    // be gated the same way editing that page would be.
    const { data: sa } = await admin.from("super_admins").select("user_id").eq("user_id", user.id).maybeSingle();
    if (!sa) {
      const { data: membership } = await supabase
        .from("tenant_members").select("role").eq("tenant_id", tenantId).eq("user_id", user.id).maybeSingle();
      if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data } = await admin
      .from("pages")
      .select("id, title, slug, status, updated_at")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .order("order_index", { ascending: true });

    return NextResponse.json({ pages: data ?? [] });
  }

  if (kind === "templates") {
    const { data: dbTemplates } = await admin
      .from("templates")
      .select("id, slug, name, description, category, screenshot_url, palette, status, owner_id")
      .not("owner_id", "is", null)
      .eq("status", "published")
      .order("updated_at", { ascending: false });

    const db = ((dbTemplates ?? []) as SiteTemplate[]).map((t) => ({
      id: t.id,
      slug: t.slug,
      name: t.name,
      description: t.description ?? "",
      category: t.category ?? "",
      screenshotUrl: t.screenshot_url,
      palette: t.palette,
      source: "db" as const,
    }));

    // Registry templates are importable too — their pages are generated on
    // demand rather than stored, handled by the import route itself.
    const registry = TEMPLATE_REGISTRY.map((t) => ({
      id: t.slug,
      slug: t.slug,
      name: t.name,
      description: t.description,
      category: t.category,
      screenshotUrl: t.previewImage,
      palette: t.palette,
      source: "registry" as const,
    }));

    return NextResponse.json({ templates: [...db, ...registry] });
  }

  if (kind === "template-pages") {
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const { data: tpl } = await admin.from("templates").select("id").eq("id", id).maybeSingle();
    if (tpl) {
      const { data } = await admin
        .from("pages")
        .select("id, title, slug, order_index")
        .eq("template_id", id)
        .is("deleted_at", null)
        .order("order_index", { ascending: true });
      return NextResponse.json({ pages: data ?? [], source: "db" });
    }

    // Registry template: one generated home page, no stored rows.
    const identity = TEMPLATE_REGISTRY.find((t) => t.slug === id);
    if (!identity) return NextResponse.json({ error: "Template not found" }, { status: 404 });
    return NextResponse.json({
      pages: [{ id: identity.slug, title: "Home", slug: "home", order_index: 0 }],
      source: "registry",
    });
  }

  return NextResponse.json({ error: "Unknown kind" }, { status: 400 });
}
