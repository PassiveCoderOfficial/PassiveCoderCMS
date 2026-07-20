import { NextRequest, NextResponse } from "next/server";
import { computeVendorSlots } from "@/lib/marketplace/slots";

/** GET ?vendor_id=…&date=YYYY-MM-DD — open slots for a vendor's live calendar. */
export async function GET(req: NextRequest) {
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Tenant not resolved" }, { status: 400 });

  const { searchParams } = new URL(req.url);
  const vendorId = searchParams.get("vendor_id");
  const date = searchParams.get("date");
  if (!vendorId || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "vendor_id and date required" }, { status: 400 });
  }

  const { slots, error } = await computeVendorSlots(vendorId, date);
  return NextResponse.json({ slots, ...(error ? { error } : {}) });
}
