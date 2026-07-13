import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "open";

  let query = supabase.from("crm_tasks")
    .select("*, contacts(id, first_name, last_name, email, phone, whatsapp)")
    .eq("tenant_id", tenantId)
    .order("due_at")
    .limit(200);
  if (status !== "all") query = query.eq("status", status);

  const { data } = await query;
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (!body.title?.trim() || !body.due_at) {
    return NextResponse.json({ error: "Title and due date required" }, { status: 400 });
  }
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase.from("crm_tasks")
    .insert({
      tenant_id: tenantId,
      contact_id: body.contact_id || null,
      title: body.title.trim(),
      due_at: body.due_at,
      remind_via: ["none", "email", "whatsapp"].includes(body.remind_via) ? body.remind_via : "email",
      assignee_user_id: body.assignee_user_id || user?.id || null,
    })
    .select("*, contacts(id, first_name, last_name, email, phone, whatsapp)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, ...fields } = await req.json();
  const patch: Record<string, unknown> = {};
  for (const key of ["title", "due_at", "status", "remind_via", "assignee_user_id"] as const) {
    if (key in fields) patch[key] = fields[key];
  }
  const { error } = await supabase.from("crm_tasks").update(patch)
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

  const { error } = await supabase.from("crm_tasks")
    .delete().eq("id", id).eq("tenant_id", tenantId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
