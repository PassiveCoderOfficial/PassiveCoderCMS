import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * Public poll target for the MONITOR screen — no auth, since the screen
 * itself has none (it's a passive TV display, not a staff tool). Tenant +
 * branch ownership + monitor_screen_enabled are re-checked on every poll,
 * not just the page's first load, so switching MONITOR off mid-shift stops
 * a screen still open on it rather than leaving it silently running.
 *
 * Deliberately narrow columns — no customer_name, no full item list, just
 * order_number/status/fulfillment_type — this is shown to every stranger
 * standing in the waiting area, not staff.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ branchId: string }> }) {
  const { branchId } = await params;
  const tenantId = (await headers()).get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await createAdminClient();
  const { data: branch } = await admin
    .from("restaurant_branches")
    .select("id, monitor_screen_enabled")
    .eq("id", branchId)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (!branch || !branch.monitor_screen_enabled) {
    return NextResponse.json({ error: "Monitor screen is not enabled for this branch" }, { status: 404 });
  }

  const { data: orders } = await admin
    .from("orders")
    .select("id, order_number, kitchen_status, fulfillment_type, created_at")
    .eq("tenant_id", tenantId)
    .eq("branch_id", branchId)
    .not("kitchen_status", "is", null)
    .not("kitchen_status", "in", "(served,picked_up,completed)")
    .order("created_at", { ascending: true })
    .limit(60); // a queue display doesn't need to show hours of backlog

  return NextResponse.json({ orders: orders ?? [] });
}
