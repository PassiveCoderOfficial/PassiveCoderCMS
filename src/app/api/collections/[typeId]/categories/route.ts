import { NextResponse } from "next/server";
import { importAccess } from "@/lib/import/access";
import { categoryInput, ownType } from "@/lib/collections/server";
import { slugify } from "@/lib/collections/types";

// Categories of one collection type (filter tabs, e.g. Civil / Mechanical).

type Ctx = { params: Promise<{ typeId: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const a = await importAccess("read");
  if ("error" in a) return a.error;
  const { typeId } = await params;
  const { data, error } = await a.admin.from("collection_categories").select("*").eq("type_id", typeId).eq("tenant_id", a.tenantId).order("sort_order");
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: Request, { params }: Ctx) {
  const a = await importAccess("write");
  if ("error" in a) return a.error;
  const { typeId } = await params;
  if (!(await ownType(a.admin, a.tenantId, typeId))) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const row = categoryInput((await req.json().catch(() => ({}))) as Record<string, unknown>);
  if (!String(row.name ?? "").trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  row.slug = row.slug || slugify(String(row.name));
  const { data, error } = await a.admin.from("collection_categories").insert({ ...row, type_id: typeId, tenant_id: a.tenantId }).select().single();
  if (error) return NextResponse.json({ error: error.code === "23505" ? "A category with this slug already exists" : error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function PATCH(req: Request, { params }: Ctx) {
  const a = await importAccess("write");
  if ("error" in a) return a.error;
  const { typeId } = await params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  if (typeof body.id !== "string") return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const { data, error } = await a.admin.from("collection_categories").update(categoryInput(body))
    .eq("id", body.id).eq("type_id", typeId).eq("tenant_id", a.tenantId).select().maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function DELETE(req: Request, { params }: Ctx) {
  const a = await importAccess("write");
  if ("error" in a) return a.error;
  const { typeId } = await params;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const { error } = await a.admin.from("collection_categories").delete().eq("id", id).eq("type_id", typeId).eq("tenant_id", a.tenantId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  // Drop the deleted id from entries that carried it.
  const { data: rows } = await a.admin.from("collection_entries").select("id, category_ids").eq("type_id", typeId).contains("category_ids", [id]);
  await Promise.all((rows ?? []).map((r) => a.admin.from("collection_entries")
    .update({ category_ids: (r.category_ids as string[]).filter((c) => c !== id) }).eq("id", r.id)));
  return NextResponse.json({ ok: true });
}
