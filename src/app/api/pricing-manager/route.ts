import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiCaller } from "@/lib/auth/api-caller";


export async function GET() {
  const caller = await getApiCaller();
  const supabase = caller?.supabase ?? (await createClient());
  const tenantId = caller?.tenantId ?? null;
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("pricing_tables")
    .select("*, pricing_packages(*)")
    .eq("tenant_id", tenantId)
    .order("sort_order");

  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  const caller = await getApiCaller();
  const supabase = caller?.supabase ?? (await createClient());
  const tenantId = caller?.tenantId ?? null;
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  if (body._type === "table") {
    const { _type, ...fields } = body;
    const { data, error } = await supabase.from("pricing_tables")
      .insert({ ...fields, tenant_id: tenantId }).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  }

  if (body._type === "package") {
    const { _type, ...fields } = body;
    const { data, error } = await supabase.from("pricing_packages")
      .insert({ ...fields, tenant_id: tenantId }).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  }

  return NextResponse.json({ error: "Invalid _type" }, { status: 400 });
}

export async function PATCH(req: Request) {
  const caller = await getApiCaller();
  const supabase = caller?.supabase ?? (await createClient());
  const tenantId = caller?.tenantId ?? null;
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { _type, id, ...fields } = await req.json();
  const table = _type === "table" ? "pricing_tables" : "pricing_packages";
  // A refused write (RLS: viewer role) changes no rows and raises no error, so check both.
  const { data, error } = await supabase.from(table as "pricing_tables").update(fields).eq("id", id).eq("tenant_id", tenantId).select("id");
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data?.length) return NextResponse.json({ error: "You don't have permission to change this." }, { status: 403 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const caller = await getApiCaller();
  const supabase = caller?.supabase ?? (await createClient());
  const tenantId = caller?.tenantId ?? null;
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const table = type === "table" ? "pricing_tables" : "pricing_packages";
  const { data, error } = await supabase.from(table as "pricing_tables").delete().eq("id", id).eq("tenant_id", tenantId).select("id");
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data?.length) return NextResponse.json({ error: "You don't have permission to change this." }, { status: 403 });
  return NextResponse.json({ ok: true });
}
