"use client";

import React, { useEffect, useState } from "react";
import type { MarketplaceVendorDirectoryBlockProps } from "@/types/cms";
import * as LucideIcons from "lucide-react";
import { Loader2, Store, MapPin, Shapes, ArrowRight, ShieldCheck } from "lucide-react";

interface VendorCategory { id: string; name: string; icon: string | null }
interface Vendor { id: string; name: string; address: string | null; categories: VendorCategory[] }

function CategoryIcon({ name, className = "w-3.5 h-3.5" }: { name: string | null; className?: string }) {
  const Icon = name ? (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name] : null;
  return Icon ? <Icon className={className} /> : <Shapes className={className} />;
}

/** Public, read-only directory of approved vendors and the categories they
 *  cover. No phone/pricing shown to anonymous browsers — that's reached
 *  through the booking flow (marketplace-booking-block.tsx) once a specific
 *  service is chosen. */
export function MarketplaceVendorDirectoryBlock({ block }: { block: MarketplaceVendorDirectoryBlockProps }) {
  const { data } = block;
  const accent = data.accentColor || "#4f46e5";

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/marketplace/public/vendors")
      .then((r) => r.json())
      .then((d) => setVendors(d.vendors ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="py-16 sm:py-20 px-4 max-w-6xl mx-auto">
      {data.title && <h2 className="text-2xl sm:text-3xl font-bold text-center mb-2">{data.title}</h2>}
      {data.subtitle && <p className="text-muted-foreground text-center mb-10 max-w-md mx-auto">{data.subtitle}</p>}

      {loading ? (
        <div className="flex justify-center py-14"><Loader2 className="w-6 h-6 animate-spin" style={{ color: accent }} /></div>
      ) : vendors.length === 0 ? (
        <div className="text-center py-14 bg-muted/40 rounded-2xl">
          <Store className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">No providers listed yet — check back soon.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {vendors.map((v) => (
            <div key={v.id} className="group bg-card border border-border rounded-2xl p-5 space-y-3.5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${accent}1a` }}>
                    <Store className="w-4.5 h-4.5" style={{ color: accent }} />
                  </div>
                  <h3 className="font-semibold text-sm truncate">{v.name}</h3>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full bg-green-50 text-green-700 shrink-0">
                  <ShieldCheck className="w-3 h-3" /> Verified
                </span>
              </div>

              {v.address && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 shrink-0" /> {v.address}
                </p>
              )}

              <div className="flex flex-wrap gap-1.5">
                {v.categories.map((c) => (
                  <span key={c.id} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-muted text-foreground/80 font-medium">
                    <CategoryIcon name={c.icon} /> {c.name}
                  </span>
                ))}
              </div>

              <a href="/book" className="inline-flex items-center gap-1 text-xs font-semibold pt-1 group-hover:gap-1.5 transition-all" style={{ color: accent }}>
                Book with this provider <ArrowRight className="w-3 h-3" />
              </a>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
