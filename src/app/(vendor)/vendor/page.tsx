import Link from "next/link";
import { Package, ShoppingBag, Wallet, AlertTriangle, Clock, TrendingUp } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import { currentVendor } from "@/lib/marketplace-ecom/vendor-auth";
import { vendorBalance } from "@/lib/marketplace-ecom/ledger";

const tk = (n: number) =>
  `৳${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default async function VendorDashboard() {
  const vendor = await currentVendor();
  if (!vendor) return null;

  const admin = await createAdminClient();
  const [{ data: subs }, { data: products }, balance] = await Promise.all([
    admin
      .from("sub_orders")
      .select("status, vendor_earning, total, created_at")
      .eq("vendor_id", vendor.vendor_id),
    admin
      .from("products")
      .select("id, status, approval_status, stock_quantity, low_stock_threshold, track_inventory")
      .eq("vendor_id", vendor.vendor_id),
    vendorBalance(admin, vendor.vendor_id),
  ]);

  const rows = subs ?? [];
  const items = products ?? [];
  const count = (s: string) => rows.filter((r) => r.status === s).length;
  const delivered = rows.filter((r) => r.status === "delivered");
  const lifetime = delivered.reduce((s, r) => s + Number(r.vendor_earning ?? 0), 0);

  const needsAction = count("pending");
  const pendingReview = items.filter((p) => p.approval_status === "pending").length;
  const rejected = items.filter((p) => p.approval_status === "rejected").length;
  const lowStock = items.filter(
    (p) => p.track_inventory && (p.stock_quantity ?? 0) <= (p.low_stock_threshold ?? 5),
  ).length;

  const stats = [
    { label: "New orders", value: needsAction, href: "/vendor/orders?status=pending", icon: ShoppingBag, accent: needsAction > 0 },
    { label: "In progress", value: count("accepted") + count("packed") + count("shipped"), href: "/vendor/orders", icon: Clock },
    { label: "Delivered", value: delivered.length, href: "/vendor/orders?status=delivered", icon: TrendingUp },
    { label: "Live listings", value: items.filter((p) => p.status === "active" && p.approval_status === "approved").length, href: "/vendor/products", icon: Package },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Hello, {vendor.name}</h1>
        <p className="text-sm text-gray-400 mt-1">
          Commission {vendor.commission_rate}% · payouts sent to your bKash after delivery
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className={`border rounded-xl p-4 transition-colors ${
              s.accent
                ? "border-emerald-700/60 bg-emerald-950/30 hover:bg-emerald-950/50"
                : "border-gray-800 bg-gray-900/40 hover:bg-gray-900/70"
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">{s.label}</p>
              <s.icon className={`w-4 h-4 ${s.accent ? "text-emerald-400" : "text-gray-600"}`} />
            </div>
            <p className="text-2xl font-bold text-white mt-2">{s.value}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="border border-gray-800 rounded-xl p-5 bg-gray-900/40">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Wallet className="w-4 h-4" /> Balance owed to you
          </div>
          <p className="text-3xl font-bold text-white mt-2">{tk(balance)}</p>
          <p className="text-xs text-gray-500 mt-2">
            Paid out after each order&apos;s return-hold window. Commission and COD fees are
            already deducted.
          </p>
          <Link
            href="/vendor/earnings"
            className="inline-block mt-3 text-sm text-emerald-400 hover:text-emerald-300"
          >
            View statement →
          </Link>
        </div>

        <div className="border border-gray-800 rounded-xl p-5 bg-gray-900/40">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <TrendingUp className="w-4 h-4" /> Lifetime earnings
          </div>
          <p className="text-3xl font-bold text-white mt-2">{tk(lifetime)}</p>
          <p className="text-xs text-gray-500 mt-2">
            From {delivered.length} delivered order{delivered.length === 1 ? "" : "s"}.
          </p>
        </div>
      </div>

      {(pendingReview > 0 || rejected > 0 || lowStock > 0) && (
        <div className="border border-amber-800/50 bg-amber-950/20 rounded-xl p-4 space-y-2">
          <p className="text-sm font-medium text-amber-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Needs your attention
          </p>
          <ul className="text-sm text-amber-200/80 space-y-1">
            {pendingReview > 0 && <li>{pendingReview} listing(s) waiting for marketplace review</li>}
            {rejected > 0 && (
              <li>
                {rejected} listing(s) rejected —{" "}
                <Link href="/vendor/products" className="underline">edit and resubmit</Link>
              </li>
            )}
            {lowStock > 0 && <li>{lowStock} product(s) low or out of stock</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
