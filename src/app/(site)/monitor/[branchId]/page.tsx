import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/server";
import { MonitorBoard } from "./monitor-board";

interface Props {
  params: Promise<{ branchId: string }>;
}

export const metadata = { title: "Order status" };

/**
 * Public, no-login order-number/queue display for a TV/screen visible to
 * waiting customers (docs/business/06-restaurant-vertical.md Phase 6) —
 * genuinely separate from KITCHEN (staff-facing, interactive) and TABLE
 * (per-table, PIN-gated ordering). This one just shows "here's what's
 * cooking, here's what's ready" with zero interaction and zero login,
 * since it's meant to run unattended on a screen behind the counter.
 *
 * Toggled per-branch (monitor_screen_enabled) — off by default, since not
 * every location has a spare screen to put this on. Resolved the same way
 * the QR table page is: admin client, no RLS dependency, tenant + branch
 * ownership checked explicitly right here.
 */
export default async function MonitorPage({ params }: Props) {
  const { branchId } = await params;
  const tenantId = (await headers()).get("x-tenant-id");
  if (!tenantId) notFound();

  const supabase = await createAdminClient();
  const { data: branch } = await supabase
    .from("restaurant_branches")
    .select("id, name, tenant_id, is_active, monitor_screen_enabled")
    .eq("id", branchId)
    .maybeSingle();

  if (!branch || branch.tenant_id !== tenantId || !branch.is_active || !branch.monitor_screen_enabled) {
    notFound();
  }

  return <MonitorBoard branchId={branchId} branchName={branch.name} />;
}
