import { NextRequest, NextResponse } from "next/server";
import { createPublicBooking, publicSlots } from "@/lib/booking/public-booking";
import { clientIp, tooMany } from "@/lib/rate-limit";

/** GET ?date=YYYY-MM-DD — list open slots for a tenant site (x-tenant-id header). */
export async function GET(req: NextRequest) {
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Tenant not resolved" }, { status: 400 });
  const r = await publicSlots(tenantId, new URL(req.url).searchParams.get("date"));
  return NextResponse.json(r.body, { status: r.status });
}

/** POST — create an appointment from the public widget. */
export async function POST(req: NextRequest) {
  const limited = tooMany(req, "booking-public", 20);
  if (limited) return limited;
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Tenant not resolved" }, { status: 400 });
  const r = await createPublicBooking(tenantId, await req.json().catch(() => null), undefined, clientIp(req));
  return NextResponse.json(r.body, { status: r.status });
}
