/**
 * Site template — read, update, delete a single template.
 * Staff may only touch their own; super admins may touch any.
 */
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireTemplateAuthor } from "@/modules/templates/permissions";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Returns the template if the caller is allowed to manage it, else null. */
async function loadOwned(admin: SupabaseClient, id: string, userId: string, isSuper: boolean) {
  const { data } = await admin.from("templates").select("*").eq("id", id).maybeSingle();
  if (!data) return null;
  if (!isSuper && data.owner_id !== userId) return null;
  return data;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const author = await requireTemplateAuthor();
  if (!author) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = await createAdminClient();
  const template = await loadOwned(admin, id, author.user.id, author.isSuperAdmin);
  if (!template) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: pages } = await admin
    .from("pages")
    .select("id, title, slug, status, order_index, updated_at")
    .eq("template_id", id)
    .is("deleted_at", null)
    .order("order_index", { ascending: true });

  return NextResponse.json({ template, pages: pages ?? [] });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const author = await requireTemplateAuthor();
  if (!author) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = await createAdminClient();
  const existing = await loadOwned(admin, id, author.user.id, author.isSuperAdmin);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json() as Record<string, unknown>;
  // Whitelist — never let a caller reassign owner_id or source_tenant_id.
  const allowed = [
    "name", "description", "category_id", "status", "featured",
    "palette", "typography", "custom_css", "logo_url", "favicon_url",
    "global_header", "global_footer", "nav_items", "screenshot_url", "tags",
  ] as const;

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of allowed) {
    if (key in body) patch[key] = body[key];
  }

  // Publishing a template is what makes it publicly listable — keep the
  // legacy `active` flag in lockstep so both the old and new read paths
  // agree on visibility.
  if (patch.status === "published") patch.active = true;
  if (patch.status === "draft" || patch.status === "archived") patch.active = false;

  // Keep the legacy free-text category column in sync when the managed
  // category changes, since old read paths still use it.
  if (typeof patch.category_id === "string") {
    const { data: cat } = await admin.from("template_categories").select("name").eq("id", patch.category_id).maybeSingle();
    if (cat?.name) patch.category = cat.name;
  }

  const { data, error } = await admin.from("templates").update(patch).eq("id", id).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ template: data });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const author = await requireTemplateAuthor();
  if (!author) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = await createAdminClient();
  const existing = await loadOwned(admin, id, author.user.id, author.isSuperAdmin);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Archive rather than hard-delete — mirrors the platform's existing
  // never-destroy-on-one-click posture (see pages soft delete, site delete
  // backups). Its pages cascade only on a real DB delete, which this isn't.
  const { error } = await admin
    .from("templates")
    .update({ status: "archived", active: false, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, archived: true });
}
