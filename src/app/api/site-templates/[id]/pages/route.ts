/** Pages belonging to a template — list + create. */
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireTemplateAuthor, slugifyTemplateName } from "@/modules/templates/permissions";
import type { SupabaseClient } from "@supabase/supabase-js";

async function assertCanEdit(admin: SupabaseClient, templateId: string, userId: string, isSuper: boolean) {
  const { data } = await admin.from("templates").select("id, owner_id").eq("id", templateId).maybeSingle();
  if (!data) return false;
  return isSuper || data.owner_id === userId;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const author = await requireTemplateAuthor();
  if (!author) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = await createAdminClient();
  if (!(await assertCanEdit(admin, id, author.user.id, author.isSuperAdmin))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data, error } = await admin
    .from("pages")
    .select("id, title, slug, status, order_index, blocks, updated_at")
    .eq("template_id", id)
    .is("deleted_at", null)
    .order("order_index", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ pages: data ?? [] });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const author = await requireTemplateAuthor();
  if (!author) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = await createAdminClient();
  if (!(await assertCanEdit(admin, id, author.user.id, author.isSuperAdmin))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json() as { title?: string; slug?: string };
  const title = (body.title ?? "").trim() || "Untitled Page";
  const slug = (body.slug ?? "").trim() || slugifyTemplateName(title) || "page";

  const { data: clash } = await admin
    .from("pages")
    .select("id")
    .eq("template_id", id)
    .eq("slug", slug)
    .maybeSingle();
  if (clash) return NextResponse.json({ error: `This template already has a page at "${slug}"` }, { status: 409 });

  const { count } = await admin
    .from("pages")
    .select("id", { count: "exact", head: true })
    .eq("template_id", id);

  const now = new Date().toISOString();
  const { data, error } = await admin
    .from("pages")
    .insert({
      template_id: id,
      tenant_id: null,
      title,
      slug,
      type: "page",
      status: "published",
      blocks: [],
      order_index: count ?? 0,
      created_at: now,
      updated_at: now,
    })
    .select("id, title, slug, order_index")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ page: data });
}
