import Link from "next/link";
import { Store, Phone, Mail, MapPin, Banknote, Truck, ShieldCheck, RotateCcw } from "lucide-react";
import type { HeaderCategory } from "./marketplace-header";

const TRUST = [
  { icon: Truck, title: "Nationwide delivery", body: "Every district in Bangladesh" },
  { icon: Banknote, title: "Cash on delivery", body: "Pay when your parcel arrives" },
  { icon: RotateCcw, title: "Easy returns", body: "7 days to change your mind" },
  { icon: ShieldCheck, title: "Verified sellers", body: "Every shop is checked first" },
];

export function MarketplaceFooter({
  logoUrl,
  siteName,
  categories,
}: {
  logoUrl: string | null;
  siteName: string;
  categories: HeaderCategory[];
}) {
  return (
    <footer className="mt-16">
      {/* Trust strip — the four things a first-time BD buyer actually wants
          answered before they hand over money. */}
      <div className="border-y border-[#EAECF0] bg-[#FFF6F2]">
        <div className="max-w-7xl mx-auto px-4 py-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST.map((t) => (
            <div key={t.title} className="flex items-start gap-3">
              <span className="w-10 h-10 rounded-xl bg-white border border-[#EAECF0] flex items-center justify-center shrink-0">
                <t.icon className="w-5 h-5 text-[#FF5A1F]" />
              </span>
              <div>
                <p className="font-semibold text-sm text-[#1A1330]">{t.title}</p>
                <p className="text-sm text-[#667085] mt-0.5">{t.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#1A1330] text-white/70">
        <div className="max-w-7xl mx-auto px-4 py-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={siteName} className="h-8 w-auto" />
            ) : (
              <p className="text-xl font-extrabold text-white">{siteName}</p>
            )}
            <p className="text-sm leading-relaxed">
              Bangladesh&apos;s marketplace — everything, from every seller. Thousands of
              products from verified shops across the country.
            </p>
          </div>

          <div>
            <p className="font-semibold text-white text-sm mb-3">Shop</p>
            <ul className="space-y-2 text-sm">
              <li><Link href="/shop" className="hover:text-white transition-colors">All products</Link></li>
              {categories.slice(0, 5).map((c) => (
                <li key={c.id}>
                  <Link href={`/shop?category=${c.id}`} className="hover:text-white transition-colors">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-semibold text-white text-sm mb-3">Sell</p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/vendor" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5" /> Seller Centre
                </Link>
              </li>
              <li><Link href="/vendor" className="hover:text-white transition-colors">Become a seller</Link></li>
              <li><Link href="/vendor/orders" className="hover:text-white transition-colors">Manage orders</Link></li>
            </ul>
          </div>

          <div>
            <p className="font-semibold text-white text-sm mb-3">Contact</p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 shrink-0" />
                <a href="tel:+8801678669699" className="hover:text-white transition-colors">
                  +880 1678 669699
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 shrink-0" />
                <a href="mailto:walibdpro@gmail.com" className="hover:text-white transition-colors">
                  walibdpro@gmail.com
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>Dhaka, Bangladesh</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 py-5 flex flex-wrap items-center gap-3 text-xs">
            <p>© {new Date().getFullYear()} {siteName}. All rights reserved.</p>
            <p className="sm:ml-auto">Cash on delivery · bKash</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
