import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("vendor_blocked_dates")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("vendor_id", id)
    .order("blocked_date");
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (!body.blocked_date) return NextResponse.json({ error: "blocked_date required" }, { status: 400 });

  const { data, error } = await supabase
    .from("vendor_blocked_dates")
    .insert({ tenant_id: tenantId, vendor_id: id, blocked_date: body.blocked_date, reason: body.reason?.trim() || null })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const blockedId = searchParams.get("id");
  if (!blockedId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { error } = await supabase.from("vendor_blocked_dates").delete().eq("id", blockedId).eq("tenant_id", tenantId).eq("vendor_id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
