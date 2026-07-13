import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";
import { upsertContact, normalizePhone } from "@/lib/crm/upsertContact";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  let q = supabase.from("jobs")
    .select("*, staff(id, name, phone)")
    .eq("tenant_id", tenantId)
    .order("scheduled_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(300);
  if (status && status !== "all") q = q.eq("status", status);

  const { data } = await q;
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (!body.title?.trim()) return NextResponse.json({ error: "Title required" }, { status: 400 });

  // Customer becomes a CRM contact when reachable
  let contactId: string | null = null;
  if (body.customer_phone || body.customer_email) {
    contactId = await upsertContact({
      tenantId,
      name: body.customer_name,
      phone: body.customer_phone,
      email: body.customer_email,
      source: "manual",
      event: { type: "system", title: `Job created: ${body.title.trim()}` },
    }).catch(() => null);
  }

  const { data, error } = await supabase.from("jobs")
    .insert({
      tenant_id: tenantId,
      contact_id: contactId,
      staff_id: body.staff_id || null,
      title: body.title.trim(),
      description: body.description?.trim() || null,
      address: body.address?.trim() || null,
      customer_name: body.customer_name?.trim() || null,
      customer_phone: normalizePhone(body.customer_phone) ?? body.customer_phone?.trim() ?? null,
      status: body.staff_id ? "assigned" : "unassigned",
      scheduled_date: body.scheduled_date || null,
      scheduled_time: body.scheduled_time || null,
      price: body.price != null && body.price !== "" ? Number(body.price) : null,
      notes: body.notes?.trim() || null,
    })
    .select("*, staff(id, name, phone)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, ...fields } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of ["title", "description", "address", "customer_name", "customer_phone",
                     "scheduled_date", "scheduled_time", "price", "notes"] as const) {
    if (key in fields) patch[key] = fields[key];
  }
  if ("staff_id" in fields) {
    patch.staff_id = fields.staff_id || null;
    // Assigning to someone bumps an unassigned job forward automatically
    if (fields.staff_id && !("status" in fields)) {
      const { data: current } = await supabase.from("jobs")
        .select("status").eq("id", id).eq("tenant_id", tenantId).maybeSingle();
      if (current?.status === "unassigned") patch.status = "assigned";
    }
  }
  if ("status" in fields) {
    patch.status = fields.status;
    if (fields.status === "completed") patch.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabase.from("jobs")
    .update(patch).eq("id", id).eq("tenant_id", tenantId)
    .select("*, staff(id, name, phone)")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Completed job with a price → income transaction in accounting
  if (fields.status === "completed" && data?.price) {
    const admin = await createAdminClient();
    const { data: settings } = await admin.from("site_settings")
      .select("currency").eq("tenant_id", tenantId).maybeSingle();
    await admin.from("transactions").insert({
      tenant_id: tenantId,
      type: "income",
      status: "completed",
      amount: data.price,
      currency: settings?.currency || "USD",
      description: `Job: ${data.title}`,
      category: "services",
      customer_name: data.customer_name,
      is_public: false,
      date: new Date().toISOString().slice(0, 10),
    }).then(() => {}, () => {});
  }

  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { error } = await supabase.from("jobs")
    .delete().eq("id", id).eq("tenant_id", tenantId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
