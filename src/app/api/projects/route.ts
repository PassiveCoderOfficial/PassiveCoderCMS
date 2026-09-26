import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";

export async function GET() {
  const supabase = await createClient();
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase.from("projects")
    .select("*, contacts(id, first_name, last_name, company)")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (!body.name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const { data, error } = await supabase.from("projects")
    .insert({
      tenant_id: tenantId,
      contact_id: body.contact_id || null,
      name: body.name.trim(),
      description: body.description?.trim() || null,
      priority: body.priority || "medium",
      start_date: body.start_date || null,
      due_date: body.due_date || null,
      budget: body.budget != null && body.budget !== "" ? Number(body.budget) : null,
      currency: body.currency?.trim().toUpperCase() || null,
    })
    .select("*, contacts(id, first_name, last_name, company)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
