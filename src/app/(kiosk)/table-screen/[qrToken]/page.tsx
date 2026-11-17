import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/server";
import { TableScreen } from "./table-screen";

interface Props {
  params: Promise<{ qrToken: string }>;
}

export const metadata = { title: "Table" };

/**
 * Per-table tablet screen (docs/business/06-restaurant-vertical.md Phase 6)
 * — separate from the plain QR scan-to-order flow at /table/[qrToken].
 * That one is a one-shot "customer scans their own phone, orders, done".
 * This one is a persistent, PIN-gated tablet MOUNTED at the table: staff
 * set a PIN once, the tablet stays logged into that table indefinitely
 * (not per-seating — see restaurant_tables.table_pin comment, migration
 * 092), showing live order status and a reorder shortcut without a
 * customer needing to scan anything themselves.
 *
 * Reuses the same qr_token as the identity anchor (one URL per table,
 * already printed/QR-coded), but requires the staff-set PIN before showing
 * anything — the token alone isn't enough here, unlike the phone-scan flow,
 * since a tablet sitting on the table is a shared, semi-public device.
 */
export default async function TableScreenPage({ params }: Props) {
  const { qrToken } = await params;
  const tenantId = (await headers()).get("x-tenant-id");
  if (!tenantId) notFound();

  const supabase = await createAdminClient();
  const { data: table } = await supabase
    .from("restaurant_tables")
    .select("id, table_number, is_active, table_pin, restaurant_branches!inner(id, name, tenant_id, is_active, table_screen_enabled)")
    .eq("qr_token", qrToken)
    .maybeSingle();

  const branch = (table as unknown as {
    restaurant_branches?: { id: string; name: string; tenant_id: string; is_active: boolean; table_screen_enabled: boolean };
  } | null)?.restaurant_branches;

  if (!table || !table.is_active || !branch || !branch.is_active || branch.tenant_id !== tenantId || !branch.table_screen_enabled) {
    notFound();
  }

  if (!table.table_pin) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-center bg-gray-950 text-white">
        <div>
          <p className="text-lg font-semibold">Table screen not set up yet</p>
          <p className="text-sm text-gray-400 mt-1">Ask staff to set a PIN for Table {table.table_number} in the dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <TableScreen
      qrToken={qrToken}
      tableId={table.id}
      tableNumber={table.table_number}
      branchName={branch.name}
    />
  );
}
