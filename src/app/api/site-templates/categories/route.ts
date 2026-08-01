/** Template categories — list for the picker, create/approve as super admin. */
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/lib/super-admin";
import { requireTemplateAuthor, slugifyTemplateName } from "@/modules/templates/permissions";

export async function GET() {
  const author = await requireTemplateAuthor();
  if (!author) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = await createAdminClient();
  // Staff pick from approved categories only; SAs also see pending requests
  // so they can approve or rename them.
  const query = admin.from("template_categories").select("*").order("sort_order", { ascending: true });
  const { data, error } = author.isSuperAdmin ? await query : await query.eq("status", "active");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ categories: data ?? [] });
}

export async function POST(req: Request) {
  const sa = await requireSuperAdmin();
  if (!sa) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, sortOrder } = await req.json() as { name?: string; sortOrder?: number };
  const trimmed = (name ?? "").trim();
  if (!trimmed) return NextResponse.json({ error: "Category name is required" }, { status: 400 });

  const admin = await createAdminClient();
  const { data, error } = await admin
    .from("template_categories")
    .upsert(
      { name: trimmed, slug: slugifyTemplateName(trimmed), status: "active", sort_order: sortOrder ?? 0 },
      { onConflict: "slug" },
    )
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ category: data });
}

export async function PATCH(req: Request) {
  const sa = await requireSuperAdmin();
  if (!sa) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, name, status, sortOrder } = await req.json() as {
    id?: string; name?: string; status?: "active" | "pending"; sortOrder?: number;
  };
  if (!id) return NextResponse.json({ error: "Category id is required" }, { status: 400 });

  const patch: Record<string, unknown> = {};
  if (name?.trim()) { patch.name = name.trim(); patch.slug = slugifyTemplateName(name.trim()); }
  if (status) patch.status = status;
  if (typeof sortOrder === "number") patch.sort_order = sortOrder;

  const admin = await createAdminClient();
  const { data, error } = await admin.from("template_categories").update(patch).eq("id", id).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ category: data });
}
