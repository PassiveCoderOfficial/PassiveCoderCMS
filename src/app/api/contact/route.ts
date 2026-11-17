import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiCaller } from "@/lib/auth/api-caller";
import { tooMany } from "@/lib/rate-limit";


export async function GET() {
  const caller = await getApiCaller();
  const supabase = caller?.supabase ?? (await createClient());
  const tenantId = caller?.tenantId ?? null;
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [{ data: details }, { data: forms }, { data: submissions }] = await Promise.all([
    supabase.from("contact_details").select("*").eq("tenant_id", tenantId).order("sort_order"),
    supabase.from("contact_forms").select("*").eq("tenant_id", tenantId),
    supabase.from("contact_form_submissions").select("id,form_id,data,ip,read,created_at").eq("tenant_id", tenantId).order("created_at", { ascending: false }).limit(100),
  ]);

  return NextResponse.json({ details: details ?? [], forms: forms ?? [], submissions: submissions ?? [] });
}

export async function POST(req: Request) {
  const limited = tooMany(req, "contact", 20);
  if (limited) return limited;
  const caller = await getApiCaller();
  const supabase = caller?.supabase ?? (await createClient());
  const tenantId = caller?.tenantId ?? null;
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  if (body._type === "detail") {
    const { _type, ...fields } = body;
    const { data, error } = await supabase
      .from("contact_details")
      .insert({ ...fields, tenant_id: tenantId })
      .select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  }

  if (body._type === "form") {
    const { _type, ...fields } = body;
    const { data, error } = await supabase
      .from("contact_forms")
      .insert({ ...fields, tenant_id: tenantId })
      .select().single();
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

  // A refused write (RLS: viewer role) changes no rows and raises no error, so check both.
  if (_type === "detail" || _type === "form") {
    const { data, error } = await supabase.from(_type === "detail" ? "contact_details" : "contact_forms")
      .update(fields).eq("id", id).eq("tenant_id", tenantId).select("id");
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (!data?.length) return NextResponse.json({ error: "You don't have permission to change this." }, { status: 403 });
  } else if (_type === "read_submission") {
    await supabase.from("contact_form_submissions").update({ read: true }).eq("id", id).eq("tenant_id", tenantId);
  }

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

  if (type === "detail" || type === "form") {
    const { data, error } = await supabase.from(type === "detail" ? "contact_details" : "contact_forms")
      .delete().eq("id", id).eq("tenant_id", tenantId).select("id");
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (!data?.length) return NextResponse.json({ error: "You don't have permission to change this." }, { status: 403 });
  } else if (type === "submission") {
    await supabase.from("contact_form_submissions").delete().eq("id", id).eq("tenant_id", tenantId);
  }

  return NextResponse.json({ ok: true });
}
