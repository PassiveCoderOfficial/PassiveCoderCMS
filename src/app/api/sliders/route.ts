import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";


export async function GET() {
  const supabase = await createClient();
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("slider_groups")
    .select("*, slider_slides(*)")
    .eq("tenant_id", tenantId)
    .order("sort_order");

  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  if (body._type === "group") {
    const { _type, ...fields } = body;
    const { data, error } = await supabase.from("slider_groups")
      .insert({ ...fields, tenant_id: tenantId }).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  }

  if (body._type === "slide") {
    const { _type, ...fields } = body;
    const { data, error } = await supabase.from("slider_slides")
      .insert({ ...fields, tenant_id: tenantId }).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  }

  return NextResponse.json({ error: "Invalid _type" }, { status: 400 });
}

export async function PATCH(req: Request) {
  const supabase = await createClient();
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { _type, id, ...fields } = await req.json();
  const table = _type === "group" ? "slider_groups" : "slider_slides";
  await supabase.from(table as "slider_groups").update(fields).eq("id", id).eq("tenant_id", tenantId);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const supabase = await createClient();
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const table = type === "group" ? "slider_groups" : "slider_slides";
  await supabase.from(table as "slider_groups").delete().eq("id", id).eq("tenant_id", tenantId);
  return NextResponse.json({ ok: true });
}
