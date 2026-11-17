import React from "react";
import Link from "next/link";
import type { CountryGridBlockProps, CountryGridItem } from "@/types/cms";
import { cn } from "@/lib/utils";
import { SiteImage } from "@/components/blocks/_primitives/site-image";
import { SectionHeading } from "@/components/blocks/_primitives";

function CountryCard({ item, accent, linkLabel }: { item: CountryGridItem; accent: string; linkLabel?: string }) {
  const inner = (
    <div className="group h-full bg-card rounded-2xl border border-black/5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all overflow-hidden flex flex-col">
      {item.image && (
        <div className="relative h-36 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <SiteImage src={item.image} alt={item.country} sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          {item.flagEmoji && (
            <span className="absolute top-3 left-3 text-2xl drop-shadow">{item.flagEmoji}</span>
          )}
          {item.processingTime && (
            <span className="absolute bottom-3 right-3 text-[11px] font-semibold px-2 py-1 rounded-full bg-card/90 text-foreground">
              ⏱ {item.processingTime}
            </span>
          )}
        </div>
      )}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-base text-foreground flex items-center gap-2">
          {!item.image && item.flagEmoji && <span className="text-xl">{item.flagEmoji}</span>}
          {item.country}
        </h3>
        {item.summary && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.summary}</p>}
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
            {linkLabel || "View details"}
            <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </span>
        )}
      </div>
    </div>
  );

  return item.href ? <Link href={item.href} className="block h-full">{inner}</Link> : inner;
}

function regionsOf(items: CountryGridItem[]) {
  const regions: string[] = [];
  for (const it of items) {
    const r = it.region ?? "Other";
    if (!regions.includes(r)) regions.push(r);
  }
  return regions;
}

/** Heading shown for a region; countries without one are grouped under "Other"
 *  (the key, anchor id and region-note match stay "Other"; only the words change). */
function regionHeading(region: string, data: CountryGridBlockProps["data"]) {
  return region === "Other" && data.otherRegionLabel ? data.otherRegionLabel : region;
}

function RegionChips({ data, accent }: { data: CountryGridBlockProps["data"]; accent: string }) {
  const items = data.items ?? [];
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {regionsOf(items).map((region) => {
        const meta = data.regions?.find((r) => r.name === region);
        return (
          <div key={region} id={region.toLowerCase().replace(/[^a-z0-9]+/g, "-")} className="rounded-2xl border bg-card p-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-xl font-bold text-foreground">{regionHeading(region, data)}</h3>
              {meta?.badge && (
                <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: `${accent}1a`, color: accent }}>{meta.badge}</span>
              )}
            </div>
            {meta?.description && <p className="mt-2 text-sm text-muted-foreground">{meta.description}</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              {items.filter((i) => (i.region ?? "Other") === region).map((item) => {
                const label = <>{item.flagEmoji && <span>{item.flagEmoji}</span>}{item.country}</>;
                const cls = "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm text-foreground transition-colors";
                return item.href ? (
                  <Link key={item.id} href={item.href} className={cn(cls, "hover:border-[var(--chip)] hover:bg-[var(--chip)] hover:text-white")} style={{ ["--chip" as string]: accent }}>
                    {label}
                  </Link>
                ) : (
                  <span key={item.id} className={cls}>{label}</span>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function CountryGridBlock({ block }: { block: CountryGridBlockProps }) {
  const { title, subtitle, eyebrow, columns = 4, groupByRegion, items = [], accentColor, display, allLink } = block.data;
  const accent = accentColor ?? "#1e3a8a";

  const colClass = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-2 lg:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-4",
  }[columns] ?? "sm:grid-cols-2 lg:grid-cols-4";

  const grid = (list: CountryGridItem[]) => (
    <div className={cn("grid grid-cols-1 gap-5", colClass)}>
      {list.map((item) => <CountryCard key={item.id} item={item} accent={accent} linkLabel={block.data.linkLabel} />)}
    </div>
  );

  let body: React.ReactNode;
  if (display === "chips") {
    body = <RegionChips data={block.data} accent={accent} />;
  } else if (groupByRegion) {
    body = (
      <div className="space-y-12">
        {regionsOf(items).map((region) => (
          <div key={region} id={region.toLowerCase().replace(/[^a-z0-9]+/g, "-")}>
            <h3 className="text-xl font-bold mb-5 flex items-center gap-3" style={{ color: accent }}>
              {regionHeading(region, block.data)}
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
      <SectionHeading eyebrow={eyebrow} title={title} subtitle={subtitle} className="mb-10" />
      {body}
      {allLink?.url && (
        <div className="mt-10 text-center">
          <Link href={allLink.url} className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white" style={{ background: accent }}>
            {allLink.label || "See all"} &rarr;
          </Link>
        </div>
      )}
    </div>
  );
}
