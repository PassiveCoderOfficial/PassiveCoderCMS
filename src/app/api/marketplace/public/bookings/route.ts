import { NextRequest, NextResponse } from "next/server";
import { createBooking } from "@/lib/marketplace/bookings";

/** POST — customer books a service on the public storefront. */
export async function POST(req: NextRequest) {
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Tenant not resolved" }, { status: 400 });

  const body = await req.json().catch(() => null);
  if (!body?.customer_name?.trim() || !body?.customer_phone?.trim()) {
    return NextResponse.json({ error: "Name and phone required" }, { status: 400 });
  }
  if (!body.subcategory_id) {
    return NextResponse.json({ error: "Service required" }, { status: 400 });
  }

  const result = await createBooking({
    tenantId,
    vendorId: body.vendor_id || null,
    subcategoryId: body.subcategory_id,
    customerName: body.customer_name,
    customerPhone: body.customer_phone,
    customerEmail: body.customer_email,
    address: body.address,
    lat: typeof body.lat === "number" ? body.lat : null,
    lng: typeof body.lng === "number" ? body.lng : null,
    scheduledDate: body.scheduled_date,
    scheduledTime: body.scheduled_time,
    price: body.price != null && body.price !== "" ? Number(body.price) : null,
    notes: body.notes,
    source: "public",
  });

  if ("error" in result) {
    const status = result.error === "That time is no longer available" ? 409 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }
  return NextResponse.json({ ok: true, id: result.id }, { status: 201 });
}
