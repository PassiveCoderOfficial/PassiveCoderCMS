import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function getTenantId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("tenant_members").select("tenant_id").eq("user_id", user.id).single();
  return data?.tenant_id ?? null;
}

export async function GET() {
  const supabase = await createClient();
  const tenantId = await getTenantId(supabase);
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("testimonial_groups")
    .select("*, testimonials(*)")
    .eq("tenant_id", tenantId)
    .order("sort_order");

  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const tenantId = await getTenantId(supabase);
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  if (body._type === "group") {
    const { _type, ...fields } = body;
    const { data, error } = await supabase.from("testimonial_groups")
      .insert({ ...fields, tenant_id: tenantId }).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  }

  if (body._type === "item") {
    const { _type, ...fields } = body;
    const { data, error } = await supabase.from("testimonials")
      .insert({ ...fields, tenant_id: tenantId }).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  }

  return NextResponse.json({ error: "Invalid _type" }, { status: 400 });
}

export async function PATCH(req: Request) {
  const supabase = await createClient();
  const tenantId = await getTenantId(supabase);
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { _type, id, ...fields } = await req.json();
  const table = _type === "group" ? "testimonial_groups" : "testimonials";
  await supabase.from(table as "testimonial_groups").update(fields).eq("id", id).eq("tenant_id", tenantId);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const supabase = await createClient();
  const tenantId = await getTenantId(supabase);
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const table = type === "group" ? "testimonial_groups" : "testimonials";
  await supabase.from(table as "testimonial_groups").delete().eq("id", id).eq("tenant_id", tenantId);
  return NextResponse.json({ ok: true });
}
