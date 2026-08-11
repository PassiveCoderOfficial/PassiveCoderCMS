import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { currentVendor } from "@/lib/marketplace-ecom/vendor-auth";
import { vendorBalance } from "@/lib/marketplace-ecom/ledger";

/** Vendor home: what needs action now, what has been earned, what is owed. */
export async function GET() {
  const vendor = await currentVendor();
  if (!vendor) return NextResponse.json({ error: "Not a vendor" }, { status: 403 });

  const admin = await createAdminClient();

  const [{ data: subs }, { data: products }, balance] = await Promise.all([
    admin
      .from("sub_orders")
      .select("status, total, vendor_earning, created_at")
      .eq("vendor_id", vendor.vendor_id),
    admin
      .from("products")
      .select("id, status, approval_status, stock_quantity, low_stock_threshold, track_inventory")
      .eq("vendor_id", vendor.vendor_id),
    vendorBalance(admin, vendor.vendor_id),
  ]);

  const rows = subs ?? [];
  const byStatus = (s: string) => rows.filter((r) => r.status === s).length;
  const delivered = rows.filter((r) => r.status === "delivered");

  const items = products ?? [];

  return NextResponse.json({
    vendor: { name: vendor.name, slug: vendor.slug, commission_rate: vendor.commission_rate },
    orders: {
      pending: byStatus("pending"),
      accepted: byStatus("accepted"),
      packed: byStatus("packed"),
      shipped: byStatus("shipped"),
      delivered: delivered.length,
      cancelled: byStatus("cancelled"),
      returned: byStatus("returned"),
      total: rows.length,
    },
    earnings: {
      // Lifetime earned counts delivered parcels only, matching when the
      // ledger actually credits the vendor.
      lifetime: delivered.reduce((s, r) => s + Number(r.vendor_earning ?? 0), 0),
      balance_due: balance,
    },
    products: {
      total: items.length,
      active: items.filter((p) => p.status === "active" && p.approval_status === "approved").length,
      pending_review: items.filter((p) => p.approval_status === "pending").length,
      rejected: items.filter((p) => p.approval_status === "rejected").length,
      low_stock: items.filter(
        (p) => p.track_inventory && (p.stock_quantity ?? 0) <= (p.low_stock_threshold ?? 5),
      ).length,
    },
  });
}
