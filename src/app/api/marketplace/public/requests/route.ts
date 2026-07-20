import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { upsertContact, normalizePhone } from "@/lib/crm/upsertContact";
import { geocodeAddress } from "@/lib/marketplace/geocode";
import { notifyNextVendorWave } from "@/lib/marketplace/notifyVendors";

/** POST — buyer posts an open service request (regular or urgent), not tied
 *  to a specific vendor. Urgent requests immediately notify the nearest 5
 *  matching vendors; if unclaimed, the escalate-requests cron notifies the
 *  next 5 every 10 minutes (see src/lib/marketplace/notifyVendors.ts). */
export async function POST(req: NextRequest) {
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Tenant not resolved" }, { status: 400 });

  const body = await req.json().catch(() => null);
  if (!body?.customer_name?.trim() || !body?.customer_phone?.trim()) {
    return NextResponse.json({ error: "Name and phone required" }, { status: 400 });
  }
  if (!body.subcategory_id) return NextResponse.json({ error: "Service required" }, { status: 400 });

  const urgency = body.urgency === "urgent" ? "urgent" : "regular";
  const radiusKm = Math.min(100, Math.max(1, Number(body.radius_km) || 15));

  let lat: number | null = typeof body.lat === "number" ? body.lat : null;
  let lng: number | null = typeof body.lng === "number" ? body.lng : null;
  if ((lat == null || lng == null) && body.address) {
    const geo = await geocodeAddress(body.address, body.region_hint);
    if (geo) { lat = geo.lat; lng = geo.lng; }
  }

  const supabase = await createAdminClient();

  let contactId: string | null = null;
  if (body.customer_phone) {
    contactId = await upsertContact({
      tenantId,
      name: body.customer_name,
      phone: body.customer_phone,
      source: "booking",
      event: { type: "booking", title: "Service request posted" },
    }).catch(() => null);
  }

  const { data: created, error } = await supabase
    .from("service_requests")
    .insert({
      tenant_id: tenantId,
      contact_id: contactId,
      subcategory_id: body.subcategory_id,
      description: body.description?.trim() || null,
      customer_name: body.customer_name.trim(),
      customer_phone: normalizePhone(body.customer_phone) ?? body.customer_phone.trim(),
      address: body.address?.trim() || null,
      lat, lng,
      urgency,
      radius_km: radiusKm,
    })
    .select("id, tenant_id, subcategory_id, lat, lng, radius_km, address, notified_vendor_ids")
    .single();

  if (error || !created) return NextResponse.json({ error: "Failed to create request" }, { status: 500 });

  let notified = 0;
  if (urgency === "urgent") {
    const { notifiedIds } = await notifyNextVendorWave(created);
    notified = notifiedIds.length;
  }

  return NextResponse.json({ ok: true, id: created.id, notified }, { status: 201 });
}
