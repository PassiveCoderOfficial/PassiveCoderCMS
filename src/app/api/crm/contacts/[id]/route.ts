import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";
import { normalizePhone } from "@/lib/crm/upsertContact";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [{ data: contact }, { data: events }, { data: tasks }] = await Promise.all([
    supabase.from("contacts").select("*, crm_stages(id, name, color)")
      .eq("id", id).eq("tenant_id", tenantId).maybeSingle(),
    supabase.from("contact_events").select("*")
      .eq("contact_id", id).eq("tenant_id", tenantId)
      .order("created_at", { ascending: false }).limit(100),
    supabase.from("crm_tasks").select("*")
      .eq("contact_id", id).eq("tenant_id", tenantId)
      .order("due_at").limit(50),
  ]);

  if (!contact) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ contact, events: events ?? [], tasks: tasks ?? [] });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

  for (const key of ["first_name", "last_name", "company", "notes", "tags",
                     "consent_email", "consent_whatsapp", "owner_user_id"] as const) {
    if (key in body) patch[key] = body[key];
  }
  if ("email" in body) patch.email = body.email?.trim().toLowerCase() || null;
  if ("phone" in body) patch.phone = normalizePhone(body.phone);
  if ("whatsapp" in body) patch.whatsapp = normalizePhone(body.whatsapp);

  // Stage change gets a timeline entry
  if ("stage_id" in body) {
    patch.stage_id = body.stage_id || null;
    const { data: prev } = await supabase.from("contacts")
      .select("stage_id, crm_stages(name)").eq("id", id).eq("tenant_id", tenantId).maybeSingle();
    if (prev && prev.stage_id !== body.stage_id) {
      const { data: newStage } = body.stage_id
        ? await supabase.from("crm_stages").select("name").eq("id", body.stage_id).maybeSingle()
        : { data: null };
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("contact_events").insert({
        tenant_id: tenantId,
        contact_id: id,
        type: "stage_change",
        title: `Stage → ${newStage?.name ?? "None"}`,
        meta: { from_stage: prev.stage_id, to_stage: body.stage_id },
        actor_user_id: user?.id ?? null,
      });
    }
  }

  const { data, error } = await supabase.from("contacts")
    .update(patch).eq("id", id).eq("tenant_id", tenantId)
    .select("*, crm_stages(id, name, color)").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase.from("contacts")
    .delete().eq("id", id).eq("tenant_id", tenantId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
