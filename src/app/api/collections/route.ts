import { layoutLockedFor } from "@/lib/tenant/layout-lock";
import { NextResponse } from "next/server";
import { importAccess } from "@/lib/import/access";
import { typeInput } from "@/lib/collections/server";
import { slugify } from "@/lib/collections/types";

// Collection types of the current site (Dashboard > Collections).

export async function GET() {
  const a = await importAccess("read");
  if ("error" in a) return a.error;
  const { data, error } = await a.admin.from("collection_types").select("*").eq("tenant_id", a.tenantId).order("sort_order").order("created_at");
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  // Entry counts per type (head-only count queries; row selects are capped at 1000).
  const counts: Record<string, number> = {};
  await Promise.all((data ?? []).map(async (t) => {
    const { count } = await a.admin.from("collection_entries").select("id", { count: "exact", head: true }).eq("type_id", t.id);
    counts[t.id] = count ?? 0;
  }));
  return NextResponse.json((data ?? []).map((t) => ({ ...t, entry_count: counts[t.id] ?? 0 })));
}

export async function POST(req: Request) {
  const a = await importAccess("write");
  if ("error" in a) return a.error;
  if (await layoutLockedFor(a.admin, a.userId, a.tenantId)) return NextResponse.json({ error: "Collection fields are managed by Passive Coder on this site." }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const row = typeInput(body);
  if (!row.name || typeof row.name !== "string") return NextResponse.json({ error: "Name is required" }, { status: 400 });
  row.slug = row.slug || slugify(row.name);
  row.singular = row.singular || row.name;
  const { data, error } = await a.admin.from("collection_types").insert({ ...row, tenant_id: a.tenantId }).select().single();
  if (error) return NextResponse.json({ error: error.code === "23505" ? "A collection with this slug already exists" : error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function PATCH(req: Request) {
  const a = await importAccess("write");
  if ("error" in a) return a.error;
  if (await layoutLockedFor(a.admin, a.userId, a.tenantId)) return NextResponse.json({ error: "Collection fields are managed by Passive Coder on this site." }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  if (typeof body.id !== "string") return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const row = typeInput(body);
  const { data, error } = await a.admin.from("collection_types").update({ ...row, updated_at: new Date().toISOString() })
    .eq("id", body.id).eq("tenant_id", a.tenantId).select().maybeSingle();
  if (error) return NextResponse.json({ error: error.code === "23505" ? "A collection with this slug already exists" : error.message }, { status: 400 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function DELETE(req: Request) {
  const a = await importAccess("write");
  if ("error" in a) return a.error;
  if (await layoutLockedFor(a.admin, a.userId, a.tenantId)) return NextResponse.json({ error: "Collection fields are managed by Passive Coder on this site." }, { status: 403 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  // Entries and categories go with it (on delete cascade).
  const { error } = await a.admin.from("collection_types").delete().eq("id", id).eq("tenant_id", a.tenantId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
