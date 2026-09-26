import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [{ data: project }, { data: tasks }] = await Promise.all([
    supabase.from("projects").select("*, contacts(id, first_name, last_name, company)")
      .eq("id", id).eq("tenant_id", tenantId).maybeSingle(),
    supabase.from("jobs").select("*, staff:tenant_team(id, name, phone)")
      .eq("project_id", id).eq("tenant_id", tenantId)
      .order("position").order("created_at"),
  ]);

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ project, tasks: tasks ?? [] });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of ["name", "description", "status", "priority", "start_date",
                     "due_date", "budget", "currency", "contact_id"] as const) {
    if (key in body) patch[key] = body[key];
  }

  const { data, error } = await supabase.from("projects")
    .update(patch).eq("id", id).eq("tenant_id", tenantId)
    .select("*, contacts(id, first_name, last_name, company)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase.from("projects")
    .delete().eq("id", id).eq("tenant_id", tenantId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
