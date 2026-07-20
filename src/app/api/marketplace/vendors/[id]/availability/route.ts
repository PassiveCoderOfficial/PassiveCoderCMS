import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";

/** GET/PUT weekly hours for a vendor. Body for PUT: array of
 *  { day_of_week, open_time, close_time, is_open } — one full-week upsert. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("vendor_availability")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("vendor_id", id)
    .order("day_of_week");
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data ?? []);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const days = Array.isArray(body.days) ? body.days : [];
  if (!days.length) return NextResponse.json({ error: "days array required" }, { status: 400 });

  const rows = days.map((d: { day_of_week: number; open_time: string; close_time: string; is_open: boolean }) => ({
    tenant_id: tenantId,
    vendor_id: id,
    day_of_week: d.day_of_week,
    open_time: d.open_time,
    close_time: d.close_time,
    is_open: d.is_open,
  }));

  const { data, error } = await supabase
    .from("vendor_availability")
    .upsert(rows, { onConflict: "vendor_id,day_of_week" })
    .select();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data ?? []);
}
