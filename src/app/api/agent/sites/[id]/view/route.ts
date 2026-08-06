import { NextResponse } from "next/server";

// Backward-compat: /api/agent/sites/[id]/view moved to /api/staff/sites/[id]/view.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.redirect(new URL(`/api/staff/sites/${id}/view`, req.url));
}
