import Link from "next/link";
import { Store, Phone, Mail, MapPin, Banknote, Truck, ShieldCheck, RotateCcw } from "lucide-react";
import type { HeaderCategory } from "./marketplace-header";

const TRUST = [
  { icon: Truck, title: "Nationwide delivery", body: "Every district in Bangladesh" },
  { icon: Banknote, title: "Cash on delivery", body: "Pay when your parcel arrives" },
  { icon: RotateCcw, title: "Easy returns", body: "7 days to change your mind" },
  { icon: ShieldCheck, title: "Verified sellers", body: "Every shop is checked first" },
];

export interface SiteContact {
  phone: string | null;
  email: string | null;
  address: string | null;
}

export function MarketplaceFooter({
  logoUrl,
  siteName,
  categories,
  contact,
}: {
  logoUrl: string | null;
  siteName: string;
  categories: HeaderCategory[];
  contact: SiteContact | null;
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
                  <Store className="w-3.5 h-3.5" /> Become a seller
                </Link>
              </li>
              <li>
                <Link href="/vendor/dashboard" className="hover:text-white transition-colors">
                  Seller Centre
                </Link>
              </li>
              <li>
                <Link href="/vendor#how-it-works" className="hover:text-white transition-colors">
                  How selling works
                </Link>
              </li>
            </ul>
            <Link
              href="/vendor/signup"
              className="inline-flex items-center gap-1.5 mt-4 bg-[#FF5A1F] hover:bg-[#E64A0F] text-white text-sm font-semibold px-4 py-2.5 rounded-full transition-colors"
            >
              <Store className="w-4 h-4" /> Start selling
            </Link>
          </div>

          <div>
            <p className="font-semibold text-white text-sm mb-3">Contact</p>
            <ul className="space-y-2 text-sm">
              {contact?.phone && (
                <li className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 shrink-0" />
                  <a
                    href={`tel:${contact.phone.replace(/\s/g, "")}`}
                    className="hover:text-white transition-colors"
                  >
                    {contact.phone}
                  </a>
                </li>
              )}
              {contact?.email && (
                <li className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  <a
                    href={`mailto:${contact.email}`}
                    className="hover:text-white transition-colors break-all"
                  >
                    {contact.email}
                  </a>
                </li>
              )}
              {contact?.address && (
                <li className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{contact.address}</span>
                </li>
              )}
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
