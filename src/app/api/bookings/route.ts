import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";


export async function GET() {
  const supabase = await createClient();
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [{ data: settings }, { data: availability }, { data: blocked }, { data: appointments }] = await Promise.all([
    supabase.from("booking_settings").select("*").eq("tenant_id", tenantId).single(),
    supabase.from("booking_availability").select("*").eq("tenant_id", tenantId).order("day_of_week"),
    supabase.from("booking_blocked_dates").select("*").eq("tenant_id", tenantId).order("blocked_date"),
    supabase.from("booking_appointments").select("*").eq("tenant_id", tenantId).order("date", { ascending: false }).limit(200),
  ]);

  return NextResponse.json({
    settings: settings ?? null,
    availability: availability ?? [],
    blocked: blocked ?? [],
    appointments: appointments ?? [],
  });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  if (body._type === "settings") {
    const { _type, ...fields } = body;
    const { data: existing } = await supabase.from("booking_settings").select("id").eq("tenant_id", tenantId).single();
    if (existing) {
      await supabase.from("booking_settings").update({ ...fields, updated_at: new Date().toISOString() }).eq("tenant_id", tenantId);
    } else {
      await supabase.from("booking_settings").insert({ ...fields, tenant_id: tenantId });
    }
    return NextResponse.json({ ok: true });
  }

  if (body._type === "availability") {
    // Upsert all 7 days at once
    const rows = (body.rows as Array<{ day_of_week: number; open_time: string; close_time: string; is_open: boolean }>).map((r) => ({
      ...r,
      tenant_id: tenantId,
    }));
    await supabase.from("booking_availability").upsert(rows, { onConflict: "tenant_id,day_of_week" });
    return NextResponse.json({ ok: true });
  }

  if (body._type === "blocked") {
    const { data, error } = await supabase.from("booking_blocked_dates")
      .insert({ tenant_id: tenantId, blocked_date: body.blocked_date, reason: body.reason ?? null })
      .select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  }

  return NextResponse.json({ error: "Invalid _type" }, { status: 400 });
}

export async function PATCH(req: Request) {
  const supabase = await createClient();
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { _type, id, ...fields } = await req.json();

  if (_type === "appointment") {
    await supabase.from("booking_appointments")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("id", id).eq("tenant_id", tenantId);
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const supabase = await createClient();
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  if (type === "blocked") {
    await supabase.from("booking_blocked_dates").delete().eq("id", id).eq("tenant_id", tenantId);
  } else if (type === "appointment") {
    await supabase.from("booking_appointments").delete().eq("id", id).eq("tenant_id", tenantId);
  }

  return NextResponse.json({ ok: true });
}
