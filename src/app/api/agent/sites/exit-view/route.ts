import { NextResponse } from "next/server";

// Backward-compat: /api/agent/sites/exit-view moved to /api/staff/sites/exit-view.
export async function GET(req: Request) {
  return NextResponse.redirect(new URL("/api/staff/sites/exit-view", req.url));
}
