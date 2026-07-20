"use client";

import React, { useEffect, useState } from "react";
import type { MarketplaceVendorDirectoryBlockProps } from "@/types/cms";
import * as LucideIcons from "lucide-react";
import { Loader2, Store, MapPin, Shapes } from "lucide-react";

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
    <section className="py-16 px-4 max-w-5xl mx-auto">
      {data.title && <h2 className="text-2xl font-bold text-center mb-2">{data.title}</h2>}
      {data.subtitle && <p className="text-gray-500 text-center mb-8">{data.subtitle}</p>}

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin" style={{ color: accent }} /></div>
      ) : vendors.length === 0 ? (
        <p className="text-center text-gray-500 py-10">No providers listed yet — check back soon.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vendors.map((v) => (
            <div key={v.id} className="border rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4" style={{ color: accent }} />
                <h3 className="font-semibold text-sm">{v.name}</h3>
              </div>
              {v.address && (
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3 shrink-0" /> {v.address}
                </p>
              )}
              <div className="flex flex-wrap gap-1.5">
                {v.categories.map((c) => (
                  <span key={c.id} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                    <CategoryIcon name={c.icon} /> {c.name}
                  </span>
                ))}
              </div>
              <a href={`/book`} className="inline-block text-xs font-medium" style={{ color: accent }}>
                Book with this provider →
              </a>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
