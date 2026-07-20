import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("vendor_booking_settings")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("vendor_id", id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data ?? {
    vendor_id: id, slot_duration_mins: 60, buffer_mins: 15, advance_days: 30, min_notice_hours: 2,
  });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { data, error } = await supabase
    .from("vendor_booking_settings")
    .upsert({
      vendor_id: id,
      tenant_id: tenantId,
      slot_duration_mins: body.slot_duration_mins ?? 60,
      buffer_mins: body.buffer_mins ?? 15,
      advance_days: body.advance_days ?? 30,
      min_notice_hours: body.min_notice_hours ?? 2,
      updated_at: new Date().toISOString(),
    }, { onConflict: "vendor_id" })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
