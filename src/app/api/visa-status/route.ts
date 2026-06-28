import { NextResponse } from "next/server";

/**
 * Visa status lookup — STUB.
 * No backing table yet (follow-up phase). Returns a friendly "not found" so the
 * status_tracker block renders a real flow without erroring. When a
 * visa_applications table exists, query it here by reference/passport.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ref = searchParams.get("ref")?.trim();

  if (!ref) {
    return NextResponse.json({ found: false, message: "Please enter a reference number." }, { status: 400 });
  }

  return NextResponse.json({
    found: false,
    message:
      "We couldn't find an application for that reference yet. If you've just applied, status may take 24–48 hours to appear. Contact our team on WhatsApp for an instant update.",
  });
}
