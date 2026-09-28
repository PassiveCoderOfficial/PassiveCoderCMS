import Link from "next/link";
import { redirect } from "next/navigation";
import { LayoutDashboard, Package, ShoppingBag, Wallet, Store, MessageCircle, Star, ExternalLink } from "lucide-react";
import { getMarketplaceChrome } from "@/lib/marketplace-ecom/chrome";
import { MARKETPLACE_TOKENS_CSS } from "@/lib/marketplace-ecom/brand-tokens";
import { currentVendor, vendorApplicationStatus } from "@/lib/marketplace-ecom/vendor-auth";

export const metadata = { title: "Seller Centre" };

const NAV = [
  { href: "/vendor/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/vendor/products", label: "My Products", icon: Package },
  { href: "/vendor/orders", label: "Orders", icon: ShoppingBag },
  { href: "/vendor/messages", label: "Messages", icon: MessageCircle },
  { href: "/vendor/reviews", label: "Reviews", icon: Star },
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

  const chrome = await getMarketplaceChrome(vendor.tenant_id);

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-foreground">
      <style precedence="pc-template" dangerouslySetInnerHTML={{ __html: MARKETPLACE_TOKENS_CSS }} />
      <header className="sticky top-0 z-30 bg-white border-b shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/vendor/dashboard" className="flex items-center gap-2 shrink-0">
            {chrome?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={chrome.logoUrl} alt={chrome.siteName} className="h-7 w-auto" />
            ) : (
              <Store className="w-5 h-5 text-primary" />
            )}
            <span className="text-[11px] font-bold uppercase tracking-wide bg-primary text-primary-foreground rounded px-1.5 py-0.5">
              Seller Centre
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-3 min-w-0">
            <span className="text-sm font-medium truncate max-w-[40vw]">{vendor.name}</span>
            {vendor.slug && (
              <Link href={`/shop?vendor=${vendor.slug}`} className="hidden sm:inline-flex items-center gap-1 text-sm text-primary font-semibold" target="_blank">
                <ExternalLink className="w-4 h-4" /> View my shop
              </Link>
            )}
          </div>
        </div>
        <nav className="max-w-6xl mx-auto px-2 flex items-center gap-1 overflow-x-auto [scrollbar-width:none]">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-muted-foreground hover:text-primary whitespace-nowrap transition-colors"
            >
              <n.icon className="w-4 h-4" />
              {n.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
