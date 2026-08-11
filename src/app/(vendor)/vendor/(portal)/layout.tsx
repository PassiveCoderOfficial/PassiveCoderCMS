import Link from "next/link";
import { redirect } from "next/navigation";
import { LayoutDashboard, Package, ShoppingBag, Wallet, Store } from "lucide-react";
import { currentVendor, vendorApplicationStatus } from "@/lib/marketplace-ecom/vendor-auth";

export const metadata = { title: "Seller Centre" };

const NAV = [
  { href: "/vendor/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/vendor/products", label: "My Products", icon: Package },
  { href: "/vendor/orders", label: "Orders", icon: ShoppingBag },
  { href: "/vendor/earnings", label: "Earnings", icon: Wallet },
];

export default async function VendorLayout({ children }: { children: React.ReactNode }) {
  const vendor = await currentVendor();

  // currentVendor only resolves *approved* ecommerce sellers, so anyone else
  // lands here. Split the two cases: a visitor with no seller account at all
  // is someone who should be signing up, while a real seller awaiting review
  // (or suspended) gets the status page. Sending both to "not active yet" is
  // what made /vendor look broken to anyone curious about selling.
  if (!vendor) {
    const status = await vendorApplicationStatus();
    redirect(status === "none" ? "/vendor/signup" : "/vendor-pending");
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#1A1330]">
      <header className="border-b border-[#EAECF0] bg-white sticky top-0 z-30 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/vendor/dashboard" className="flex items-center gap-2 font-semibold shrink-0">
            <Store className="w-5 h-5 text-[#FF5A1F]" />
            <span className="hidden sm:inline">Seller Centre</span>
          </Link>
          <nav className="flex items-center gap-1 overflow-x-auto">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="px-3 py-1.5 rounded-lg text-sm text-[#667085] hover:text-[#1A1330] hover:bg-[#F9FAFB] whitespace-nowrap transition-colors"
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto text-sm text-[#667085] truncate max-w-[40%] text-right">
            {vendor.name}
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
