import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { TableLanding } from "./table-landing";

interface Props {
  params: Promise<{ qrToken: string }>;
}

export const metadata = { title: "Order at your table" };

/**
 * QR-code landing page for dine-in ordering (docs/business/06-restaurant-vertical.md
 * phase 2). A customer scans the code printed on their table, lands here,
 * and the token is stashed client-side (see table-landing.tsx) before
 * bouncing to the shop — the shop and checkout pages neither know nor need
 * to know about tables; they just read the stashed token when it matters.
 *
 * Resolved server-side against the current tenant so a QR code printed by
 * one restaurant can never be used to silently order from another.
 */
export default async function TablePage({ params }: Props) {
  const { qrToken } = await params;
  const tenantId = (await headers()).get("x-tenant-id");
  if (!tenantId) notFound();

  const supabase = await createClient();
  const { data: table } = await supabase
    .from("restaurant_tables")
    .select("id, table_number, is_active, restaurant_branches!inner(id, name, tenant_id, is_active)")
    .eq("qr_token", qrToken)
    .maybeSingle();

  const branch = (table as unknown as {
    restaurant_branches?: { id: string; name: string; tenant_id: string; is_active: boolean };
  } | null)?.restaurant_branches;

  if (!table || !table.is_active || !branch || !branch.is_active || branch.tenant_id !== tenantId) {
    notFound();
  }

  return (
    <TableLanding
      qrToken={qrToken}
      tableNumber={table.table_number}
      branchName={branch.name}
    />
  );
}
