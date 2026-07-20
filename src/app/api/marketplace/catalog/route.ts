import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";

export async function GET() {
  const supabase = await createClient();
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("service_categories")
    .select("*, service_subcategories(*)")
    .eq("tenant_id", tenantId)
    .order("sort_order");
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  if (body._type === "category") {
    if (!body.name?.trim() || !body.slug?.trim()) return NextResponse.json({ error: "Name and slug required" }, { status: 400 });
    const { data, error } = await supabase
      .from("service_categories")
      .insert({ tenant_id: tenantId, name: body.name.trim(), slug: body.slug.trim(), sort_order: body.sort_order ?? 0, icon: body.icon?.trim() || null })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  }

  if (body._type === "subcategory") {
    if (!body.name?.trim() || !body.category_id) return NextResponse.json({ error: "Name and category_id required" }, { status: 400 });
    const { data, error } = await supabase
      .from("service_subcategories")
      .insert({ tenant_id: tenantId, category_id: body.category_id, name: body.name.trim(), sort_order: body.sort_order ?? 0 })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  }

  return NextResponse.json({ error: "Invalid _type" }, { status: 400 });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { _type, id, ...fields } = await req.json();
  const table = _type === "category" ? "service_categories" : _type === "subcategory" ? "service_subcategories" : null;
  if (!table || !id) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { error } = await supabase.from(table).update(fields).eq("id", id).eq("tenant_id", tenantId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const id = searchParams.get("id");
  const table = type === "category" ? "service_categories" : type === "subcategory" ? "service_subcategories" : null;
  if (!table || !id) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { error } = await supabase.from(table).delete().eq("id", id).eq("tenant_id", tenantId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
