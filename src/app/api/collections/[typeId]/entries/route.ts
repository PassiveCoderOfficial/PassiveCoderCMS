import { NextResponse } from "next/server";
import { importAccess } from "@/lib/import/access";
import { entryInput, ownType, uniqueEntrySlug } from "@/lib/collections/server";
import { slugify } from "@/lib/collections/types";

// Entries of one collection type. GET returns every entry (paged internally,
// PostgREST caps a select at 1000 rows); POST takes one entry or
// { entries: [...] } for CSV import; PATCH takes one entry or
// { ids, set } for bulk edits; DELETE takes ?id= or ?ids=a,b.

type Ctx = { params: Promise<{ typeId: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const a = await importAccess("read");
  if ("error" in a) return a.error;
  const { typeId } = await params;
  if (!(await ownType(a.admin, a.tenantId, typeId))) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const all: unknown[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await a.admin.from("collection_entries").select("*").eq("type_id", typeId)
      .order("sort_order").order("created_at", { ascending: false }).range(from, from + 999);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    all.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  return NextResponse.json(all);
}

export async function POST(req: Request, { params }: Ctx) {
  const a = await importAccess("write");
  if ("error" in a) return a.error;
  const { typeId } = await params;
  if (!(await ownType(a.admin, a.tenantId, typeId))) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  if (Array.isArray(body.entries)) {
    // Bulk import: slugs made unique within the batch and against existing rows.
    const taken = new Set<string>();
    for (let from = 0; ; from += 1000) {
      const { data } = await a.admin.from("collection_entries").select("slug").eq("type_id", typeId).range(from, from + 999);
      for (const r of data ?? []) taken.add(r.slug);
      if (!data || data.length < 1000) break;
    }
    const rows = (body.entries as Record<string, unknown>[]).filter((e) => e && String(e.title ?? "").trim()).map((e, i) => {
      const row = entryInput(e);
      let slug = slugify(String(row.slug || row.title));
      if (taken.has(slug)) { let n = 2; while (taken.has(`${slug}-${n}`)) n++; slug = `${slug}-${n}`; }
      taken.add(slug);
      return { sort_order: i, ...row, slug, type_id: typeId, tenant_id: a.tenantId };
    });
    let inserted = 0;
    for (let i = 0; i < rows.length; i += 500) {
      const { error, count } = await a.admin.from("collection_entries").insert(rows.slice(i, i + 500), { count: "exact" });
      if (error) return NextResponse.json({ error: error.message, inserted }, { status: 400 });
      inserted += count ?? 0;
    }
    return NextResponse.json({ ok: true, inserted });
  }

  const row = entryInput(body);
  if (!String(row.title ?? "").trim()) return NextResponse.json({ error: "Title is required" }, { status: 400 });
  row.slug = await uniqueEntrySlug(a.admin, typeId, String(row.slug || row.title));
  const { data, error } = await a.admin.from("collection_entries").insert({ ...row, type_id: typeId, tenant_id: a.tenantId }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function PATCH(req: Request, { params }: Ctx) {
  const a = await importAccess("write");
  if ("error" in a) return a.error;
  const { typeId } = await params;
  if (!(await ownType(a.admin, a.tenantId, typeId))) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const now = new Date().toISOString();

  if (Array.isArray(body.ids)) {
    const set = entryInput((body.set ?? {}) as Record<string, unknown>);
    delete set.slug;
    const { error } = await a.admin.from("collection_entries").update({ ...set, updated_at: now })
      .in("id", body.ids as string[]).eq("type_id", typeId).eq("tenant_id", a.tenantId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }
  // Reorder: { order: [id, id, ...] } sets sort_order to the position.
  if (Array.isArray(body.order)) {
    await Promise.all((body.order as string[]).map((id, i) =>
      a.admin.from("collection_entries").update({ sort_order: i }).eq("id", id).eq("type_id", typeId).eq("tenant_id", a.tenantId)));
    return NextResponse.json({ ok: true });
  }

  if (typeof body.id !== "string") return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const row = entryInput(body);
  if ("slug" in row || "title" in row) {
    if (!row.slug && !row.title) delete row.slug;
    else if ("slug" in row) row.slug = await uniqueEntrySlug(a.admin, typeId, String(row.slug || row.title), body.id);
  }
  const { data, error } = await a.admin.from("collection_entries").update({ ...row, updated_at: now })
    .eq("id", body.id).eq("type_id", typeId).eq("tenant_id", a.tenantId).select().maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function DELETE(req: Request, { params }: Ctx) {
  const a = await importAccess("write");
  if ("error" in a) return a.error;
  const { typeId } = await params;
  const sp = new URL(req.url).searchParams;
  const ids = (sp.get("ids") ?? sp.get("id") ?? "").split(",").filter(Boolean);
  if (!ids.length) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const { error } = await a.admin.from("collection_entries").delete().in("id", ids).eq("type_id", typeId).eq("tenant_id", a.tenantId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
