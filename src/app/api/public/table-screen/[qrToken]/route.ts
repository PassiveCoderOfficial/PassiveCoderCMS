import { NextRequest, NextResponse } from "next/server";
import { clientIp, isLimited, rateLimited } from "@/lib/rate-limit";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * Public poll target for the TABLE screen, gated by the table's own PIN —
 * the qr_token identifies WHICH table, the PIN (sent on every request, not
 * just once) is what actually authorizes reading its live orders. No
 * session/cookie state on the server: a tablet that's been PIN-unlocked
 * client-side (see table-screen.tsx) just keeps sending the PIN along with
 * every poll, simpler than a token exchange for a device that's meant to
 * sit logged in indefinitely anyway.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ qrToken: string }> }) {
  const { qrToken } = await params;
  const tenantId = (await headers()).get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const pin = req.nextUrl.searchParams.get("pin") ?? "";

  const admin = await createAdminClient();
  const { data: table } = await admin
    .from("restaurant_tables")
    .select("id, table_pin, branch_id, restaurant_branches!inner(tenant_id, table_screen_enabled)")
    .eq("qr_token", qrToken)
    .maybeSingle();

  const branch = (table as unknown as { restaurant_branches?: { tenant_id: string; table_screen_enabled: boolean } } | null)?.restaurant_branches;
  if (!table || !branch || branch.tenant_id !== tenantId || !branch.table_screen_enabled) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  // PIN guessing: 10 wrong tries from one address lock that address out of
  // this table for 10 minutes. A screen that sends the right PIN is never
  // counted, however often it polls.
  const failKey = `table-pin:${table.id}:${clientIp(req)}`;
  if (isLimited(failKey, 10)) {
    return NextResponse.json({ error: "Too many wrong PINs. Please wait 10 minutes and try again." }, { status: 429, headers: { "Retry-After": "600" } });
  }
  if (!table.table_pin || table.table_pin !== pin) {
    rateLimited(failKey, 10, 10 * 60_000);
    return NextResponse.json({ error: "Incorrect PIN" }, { status: 401 });
  }

  const { data: orders } = await admin
    .from("orders")
    .select("id, order_number, items, kitchen_status, created_at")
    .eq("tenant_id", tenantId)
    .eq("table_id", table.id)
    .not("kitchen_status", "is", null)
    .order("created_at", { ascending: false })
    .limit(10);

  return NextResponse.json({ orders: orders ?? [] });
}
