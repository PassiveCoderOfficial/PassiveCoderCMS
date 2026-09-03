import { NextResponse } from "next/server";
import { headers } from "next/headers";

// TEMP diagnostic route — remove after the analytics header-propagation bug
// is confirmed fixed. Echoes exactly what headers() sees for this request.
export async function GET() {
  const h = await headers();
  return NextResponse.json({
    "x-pathname": h.get("x-pathname"),
    "x-tenant-id": h.get("x-tenant-id"),
    host: h.get("host"),
  });
}
