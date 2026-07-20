import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("vendor_services")
    .select("*, service_subcategories(id, name, category_id)")
    .eq("tenant_id", tenantId)
    .eq("vendor_id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (!body.subcategory_id) return NextResponse.json({ error: "subcategory_id required" }, { status: 400 });

  const { data, error } = await supabase
    .from("vendor_services")
    .upsert(
      {
        tenant_id: tenantId,
        vendor_id: id,
        subcategory_id: body.subcategory_id,
        price: body.price != null && body.price !== "" ? Number(body.price) : null,
        active: body.active ?? true,
      },
      { onConflict: "vendor_id,subcategory_id" }
    )
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const subcategoryId = searchParams.get("subcategory_id");
  if (!subcategoryId) return NextResponse.json({ error: "Missing subcategory_id" }, { status: 400 });

  const { error } = await supabase
    .from("vendor_services")
    .delete()
    .eq("tenant_id", tenantId)
    .eq("vendor_id", id)
    .eq("subcategory_id", subcategoryId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
