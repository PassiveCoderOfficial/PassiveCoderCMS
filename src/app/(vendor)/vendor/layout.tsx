import Link from "next/link";
import { redirect } from "next/navigation";
import { LayoutDashboard, Package, ShoppingBag, Wallet, Store } from "lucide-react";
import { currentVendor } from "@/lib/marketplace-ecom/vendor-auth";

export const metadata = { title: "Seller Centre" };

const NAV = [
  { href: "/vendor", label: "Dashboard", icon: LayoutDashboard },
  { href: "/vendor/products", label: "My Products", icon: Package },
  { href: "/vendor/orders", label: "Orders", icon: ShoppingBag },
  { href: "/vendor/earnings", label: "Earnings", icon: Wallet },
];

export default async function VendorLayout({ children }: { children: React.ReactNode }) {
  const vendor = await currentVendor();
  // Sellers who aren't approved (or aren't sellers at all) never see the
  // portal shell — currentVendor only resolves approved ecommerce vendors.
  if (!vendor) redirect("/vendor-pending");

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="border-b border-gray-800 bg-gray-900/60 sticky top-0 z-30 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/vendor" className="flex items-center gap-2 font-semibold shrink-0">
            <Store className="w-5 h-5 text-emerald-400" />
            <span className="hidden sm:inline">Seller Centre</span>
          </Link>
          <nav className="flex items-center gap-1 overflow-x-auto">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 whitespace-nowrap transition-colors"
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto text-sm text-gray-400 truncate max-w-[40%] text-right">
            {vendor.name}
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
