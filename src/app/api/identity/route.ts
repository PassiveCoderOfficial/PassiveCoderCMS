import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";


export async function GET() {
  const supabase = await createClient();
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [{ data: identity }, { data: menus }] = await Promise.all([
    supabase.from("site_identity").select("*").eq("tenant_id", tenantId).single(),
    supabase.from("nav_menus").select("*").eq("tenant_id", tenantId),
  ]);

  return NextResponse.json({ identity: identity ?? null, menus: menus ?? [] });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  if (body._type === "identity") {
    const { _type, ...fields } = body;
    const { data: existing } = await supabase.from("site_identity").select("id").eq("tenant_id", tenantId).single();
    if (existing) {
      await supabase.from("site_identity").update({ ...fields, updated_at: new Date().toISOString() }).eq("tenant_id", tenantId);
    } else {
      await supabase.from("site_identity").insert({ ...fields, tenant_id: tenantId });
    }
    return NextResponse.json({ ok: true });
  }

  if (body._type === "menu") {
    const { _type, ...fields } = body;
    const { data, error } = await supabase.from("nav_menus")
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

  if (_type === "menu") {
    await supabase.from("nav_menus").update({ ...fields, updated_at: new Date().toISOString() })
      .eq("id", id).eq("tenant_id", tenantId);
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const supabase = await createClient();
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await supabase.from("nav_menus").delete().eq("id", id).eq("tenant_id", tenantId);
  return NextResponse.json({ ok: true });
}
