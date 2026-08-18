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
import { checkTenantEditAccess } from "@/modules/tenant/can-edit";
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
    const access = await checkTenantEditAccess(admin, tenantId, user.id);
    if (!access.allowed) {
      return NextResponse.json(
        { error: "You don't have permission to read that site's pages." },
        { status: 403 },
      );
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

    return NextResponse.json({ templates: db });
  }

  if (kind === "template-pages") {
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const { data: tpl } = await admin.from("templates").select("id").eq("id", id).maybeSingle();
    if (!tpl) return NextResponse.json({ error: "Template not found" }, { status: 404 });

    const { data } = await admin
      .from("pages")
      .select("id, title, slug, order_index")
      .eq("template_id", id)
      .is("deleted_at", null)
      .order("order_index", { ascending: true });
    return NextResponse.json({ pages: data ?? [], source: "db" });
  }

  return NextResponse.json({ error: "Unknown kind" }, { status: 400 });
}
