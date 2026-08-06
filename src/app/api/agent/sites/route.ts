import { NextResponse } from "next/server";

// Backward-compat: /api/agent/sites moved to /api/staff/sites.
export async function POST(req: Request) {
  return NextResponse.redirect(new URL("/api/staff/sites", req.url), 307);
}
