/**
 * Site templates — list + create.
 *
 * Deliberately mounted at /api/site-templates, not /api/templates: the
 * latter already serves the legacy catalog (TEMPLATE_REGISTRY-backed) and
 * both must coexist until Phase 3 retires the old path.
 */
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireTemplateAuthor, slugifyTemplateName } from "@/modules/templates/permissions";
import { snapshotTenantIntoTemplate } from "@/modules/templates/snapshot";
import type { CreateTemplateInput } from "@/modules/templates/types";

export async function GET() {
  const author = await requireTemplateAuthor();
  if (!author) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = await createAdminClient();
  // Staff see only their own templates; super admins see every one.
  let query = admin
    .from("templates")
    .select("id, slug, name, description, category, category_id, status, active, featured, screenshot_url, owner_id, source_tenant_id, palette, created_at, updated_at")
    .order("updated_at", { ascending: false });

  if (!author.isSuperAdmin) {
    query = query.eq("owner_id", author.user.id);
  } else {
    // A super admin's "My Templates" still means templates authored through
    // this engine — not the 54 legacy catalog rows, which have no owner.
    query = query.not("owner_id", "is", null);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ templates: data ?? [] });
}

export async function POST(req: Request) {
  const author = await requireTemplateAuthor();
  if (!author) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json() as CreateTemplateInput;
  const name = (body.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "Template name is required" }, { status: 400 });

  const slug = (body.slug ?? "").trim() || slugifyTemplateName(name);
  if (!slug) return NextResponse.json({ error: "Could not derive a slug from that name" }, { status: 400 });

  const admin = await createAdminClient();

  const { data: existing } = await admin.from("templates").select("id").eq("slug", slug).maybeSingle();
  if (existing) {
    return NextResponse.json({ error: `Slug "${slug}" is already taken` }, { status: 409 });
  }

  // Staff may request a category that doesn't exist yet — it lands as
  // 'pending' for an SA to approve/rename rather than silently creating a
  // live category anyone can pick.
  let categoryId = body.categoryId ?? null;
  if (!categoryId && body.requestedCategoryName?.trim()) {
    const reqName = body.requestedCategoryName.trim();
    const reqSlug = slugifyTemplateName(reqName);
    const { data: cat } = await admin
      .from("template_categories")
      .upsert(
        {
          name: reqName,
          slug: reqSlug,
          status: author.isSuperAdmin ? "active" : "pending",
          requested_by: author.user.id,
        },
        { onConflict: "slug" },
      )
      .select("id")
      .single();
    categoryId = cat?.id ?? null;
  }

  // Keep the legacy free-text `category` column populated too — the old
  // catalog reads still depend on it until Phase 3.
  let categoryName = "General Business";
  if (categoryId) {
    const { data: cat } = await admin.from("template_categories").select("name").eq("id", categoryId).maybeSingle();
    categoryName = cat?.name ?? categoryName;
  }

  const { data: template, error } = await admin
    .from("templates")
    .insert({
      slug,
      name,
      description: body.description?.trim() ?? "",
      category: categoryName,
      category_id: categoryId,
      owner_id: author.user.id,
      status: "draft",
      // Legacy catalog rows default to active=true and are publicly listed;
      // a brand-new template must not appear anywhere until it's published.
      active: false,
      logo_url: body.logoUrl ?? null,
      favicon_url: body.faviconUrl ?? null,
    })
    .select("id, slug")
    .single();

  if (error || !template) {
    return NextResponse.json({ error: error?.message ?? "Failed to create template" }, { status: 500 });
  }

  // Path 2: snapshot an existing tenant site into this new template.
  let pagesCopied = 0;
  if (body.sourceTenantId) {
    try {
      const result = await snapshotTenantIntoTemplate(admin, body.sourceTenantId, template.id);
      pagesCopied = result.pagesCopied;
    } catch (err) {
      // The template row exists but is empty — surface that rather than
      // leaving the caller thinking a full snapshot succeeded.
      return NextResponse.json(
        { error: `Template created but snapshot failed: ${err instanceof Error ? err.message : "unknown error"}`, templateId: template.id },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ template, pagesCopied });
}
