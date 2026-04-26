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
    .from("feature_groups")
    .select("*, feature_items(*)")
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
    const { data, error } = await supabase
      .from("feature_groups")
      .insert({ tenant_id: tenantId, name: body.name, slug: body.slug, sort_order: body.sort_order ?? 0 })
      .select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  }

  if (body._type === "item") {
    const { data, error } = await supabase
      .from("feature_items")
      .insert({
        group_id: body.group_id, tenant_id: tenantId,
        title: body.title, description: body.description ?? "",
        icon_type: body.icon_type ?? "lucide", icon: body.icon ?? null,
        image_url: body.image_url ?? null, link: body.link ?? null,
        link_label: body.link_label ?? null, sort_order: body.sort_order ?? 0,
      })
      .select().single();
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
  const table = _type === "group" ? "feature_groups" : "feature_items";
  const { error } = await supabase.from(table as "feature_groups").update(fields).eq("id", id).eq("tenant_id", tenantId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
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

  const table = type === "group" ? "feature_groups" : "feature_items";
  await supabase.from(table as "feature_groups").delete().eq("id", id).eq("tenant_id", tenantId);
  return NextResponse.json({ ok: true });
}
