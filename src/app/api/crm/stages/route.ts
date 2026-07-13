import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";

export async function GET() {
  const supabase = await createClient();
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase.from("crm_stages")
    .select("*").eq("tenant_id", tenantId).order("position");
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { data: last } = await supabase.from("crm_stages")
    .select("position").eq("tenant_id", tenantId)
    .order("position", { ascending: false }).limit(1).maybeSingle();

  const { data, error } = await supabase.from("crm_stages")
    .insert({
      tenant_id: tenantId,
      name: body.name?.trim() || "New stage",
      color: body.color || "#6366f1",
      position: (last?.position ?? -1) + 1,
      is_won: !!body.is_won,
      is_lost: !!body.is_lost,
    })
    .select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  // Bulk reorder: [{id, position}, …]
  if (Array.isArray(body.order)) {
    for (const { id, position } of body.order as Array<{ id: string; position: number }>) {
      await supabase.from("crm_stages").update({ position })
        .eq("id", id).eq("tenant_id", tenantId);
    }
    return NextResponse.json({ ok: true });
  }

  const { id, ...fields } = body;
  const patch: Record<string, unknown> = {};
  for (const key of ["name", "color", "is_won", "is_lost"] as const) {
    if (key in fields) patch[key] = fields[key];
  }
  const { error } = await supabase.from("crm_stages").update(patch)
    .eq("id", id).eq("tenant_id", tenantId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  // contacts.stage_id is ON DELETE SET NULL — contacts survive stage deletion
  const { error } = await supabase.from("crm_stages")
    .delete().eq("id", id).eq("tenant_id", tenantId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
