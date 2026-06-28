import React from "react";
import Link from "next/link";
import type { CountryGridBlockProps, CountryGridItem } from "@/types/cms";
import { cn } from "@/lib/utils";

function CountryCard({ item, accent }: { item: CountryGridItem; accent: string }) {
  const inner = (
    <div className="group h-full bg-white rounded-2xl border border-black/5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all overflow-hidden flex flex-col">
      {item.image && (
        <div className="relative h-36 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.image} alt={item.country} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          {item.flagEmoji && (
            <span className="absolute top-3 left-3 text-2xl drop-shadow">{item.flagEmoji}</span>
          )}
          {item.processingTime && (
            <span className="absolute bottom-3 right-3 text-[11px] font-semibold px-2 py-1 rounded-full bg-white/90 text-gray-800">
              ⏱ {item.processingTime}
            </span>
          )}
        </div>
      )}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-base text-gray-900 flex items-center gap-2">
          {!item.image && item.flagEmoji && <span className="text-xl">{item.flagEmoji}</span>}
          {item.country}
        </h3>
        {item.summary && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.summary}</p>}
        {item.visaTypes && item.visaTypes.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {item.visaTypes.slice(0, 3).map((v, i) => (
              <span key={i} className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: `${accent}1a`, color: accent }}>
                {v}
              </span>
            ))}
          </div>
        )}
        {item.href && (
          <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold pt-1" style={{ color: accent }}>
            View details
            <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </span>
        )}
      </div>
    </div>
  );

  return item.href ? <Link href={item.href} className="block h-full">{inner}</Link> : inner;
}

export function CountryGridBlock({ block }: { block: CountryGridBlockProps }) {
  const { title, subtitle, columns = 4, groupByRegion, items = [], accentColor } = block.data;
  const accent = accentColor ?? "#1e3a8a";

  const colClass = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-2 lg:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-4",
  }[columns] ?? "sm:grid-cols-2 lg:grid-cols-4";

  const grid = (list: CountryGridItem[]) => (
    <div className={cn("grid grid-cols-1 gap-5", colClass)}>
      {list.map((item) => <CountryCard key={item.id} item={item} accent={accent} />)}
    </div>
  );

  let body: React.ReactNode;
  if (groupByRegion) {
    const regions: string[] = [];
    for (const it of items) {
      const r = it.region ?? "Other";
      if (!regions.includes(r)) regions.push(r);
    }
    body = (
      <div className="space-y-12">
        {regions.map((region) => (
          <div key={region} id={region.toLowerCase().replace(/[^a-z0-9]+/g, "-")}>
            <h3 className="text-xl font-bold mb-5 flex items-center gap-3" style={{ color: accent }}>
              {region}
              <span className="flex-1 h-px" style={{ background: `${accent}26` }} />
            </h3>
            {grid(items.filter((i) => (i.region ?? "Other") === region))}
          </div>
        ))}
      </div>
    );
  } else {
    body = grid(items);
  }

  return (
    <div className="max-w-7xl mx-auto px-4">
      {(title || subtitle) && (
        <div className="text-center mb-10">
          {title && <h2 className="text-3xl md:text-4xl font-bold text-gray-900">{title}</h2>}
          {subtitle && <p className="text-lg text-gray-500 mt-3 max-w-2xl mx-auto">{subtitle}</p>}
        </div>
      )}
      {body}
    </div>
  );
}
