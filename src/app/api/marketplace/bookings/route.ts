import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";
import { createBooking, computeCommission } from "@/lib/marketplace/bookings";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  let q = supabase
    .from("marketplace_bookings")
    .select("*, vendors(id, name, phone), service_subcategories(id, name)")
    .eq("tenant_id", tenantId)
    .order("scheduled_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(300);
  if (status && status !== "all") q = q.eq("status", status);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data ?? []);
}

/** Admin-side booking creation (Tanmoy staff booking on a customer's behalf).
 *  Public storefront bookings go through /api/marketplace/public/bookings instead. */
export async function POST(req: NextRequest) {
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const result = await createBooking({
    tenantId,
    vendorId: body.vendor_id,
    subcategoryId: body.subcategory_id,
    customerName: body.customer_name,
    customerPhone: body.customer_phone,
    customerEmail: body.customer_email,
    address: body.address,
    scheduledDate: body.scheduled_date,
    scheduledTime: body.scheduled_time,
    price: body.price != null && body.price !== "" ? Number(body.price) : null,
    notes: body.notes,
    source: "manual",
  });
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json(result, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, ...fields } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of ["customer_name", "customer_phone", "address", "scheduled_date",
                     "scheduled_time", "price", "notes", "vendor_id", "subcategory_id"] as const) {
    if (key in fields) patch[key] = fields[key];
  }

  // Re-snapshot commission if price or vendor changed
  if ("price" in fields || "vendor_id" in fields) {
    const { data: current } = await supabase.from("marketplace_bookings")
      .select("price, vendor_id, commission_rate").eq("id", id).eq("tenant_id", tenantId).maybeSingle();
    const vendorId = "vendor_id" in fields ? fields.vendor_id : current?.vendor_id;
    const price = "price" in fields ? Number(fields.price) : current?.price;
    let commissionRate: number | null = null;
    if (vendorId) {
      const { data: vendor } = await supabase.from("vendors").select("commission_rate").eq("id", vendorId).maybeSingle();
      commissionRate = vendor?.commission_rate ?? null;
    }
    const { commissionAmount, commissionRate: rate } = computeCommission(price, commissionRate);
    patch.commission_rate = rate;
    patch.commission_amount = commissionAmount;
  }

  if ("vendor_id" in fields && fields.vendor_id && !("status" in fields)) {
    const { data: currentStatus } = await supabase.from("marketplace_bookings")
      .select("status").eq("id", id).eq("tenant_id", tenantId).maybeSingle();
    if (currentStatus?.status === "pending") patch.status = "confirmed";
  }
  if ("status" in fields) {
    patch.status = fields.status;
    if (fields.status === "completed") patch.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabase.from("marketplace_bookings")
    .update(patch).eq("id", id).eq("tenant_id", tenantId)
    .select("*, vendors(id, name, phone), service_subcategories(id, name)")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
