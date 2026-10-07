import React from "react";
import type { ServicesBlockProps } from "@/types/cms";
import { cn } from "@/lib/utils";
import { BqLink, bqStyle } from "@/components/blocks/_primitives/boutique";

const RATIO = { landscape: "605 / 412", square: "361 / 376", portrait: "3 / 4" } as const;

/**
 * Boutique Tiles: photo tiles with an upper-case serif caption under each and an
 * optional pill button (item "button text"). Two columns read as large
 * category banners (Men / Women), three or four as a collection grid.
 */
export function ServicesBoutiqueTiles({ data }: { data: ServicesBlockProps["data"] }) {
  const cols = data.columns ?? 3;
  const ratio = RATIO[data.tileRatio ?? (cols === 2 ? "landscape" : "square")];
  const grid = cols === 2 ? "sm:grid-cols-2 gap-9 lg:gap-[70px] max-w-[1168px]" : cols === 4 ? "sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-[1240px]" : "sm:grid-cols-2 lg:grid-cols-3 gap-x-[35px] gap-y-14 max-w-[1152px]";
  return (
    <div className="bq" style={bqStyle(data.colors)}>
      <div className="bq-wrap">
        {data.title && <h2 className="bq-h bq-upper text-center m-0 mb-10" style={{ fontSize: 26 }}>{data.title}</h2>}
        {data.subtitle && <p className="text-center text-[16px] font-medium m-0 mb-10 sm:mb-14">{data.subtitle}</p>}
        <div className={cn("grid grid-cols-1 mx-auto", grid)}>
          {data.items.map((it) => {
            const img = it.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={it.imageUrl} alt={it.title} loading="lazy" className={cn("w-full object-cover block", cols !== 2 && "rounded")} style={{ aspectRatio: ratio }} />
            ) : <div className="w-full bg-muted rounded" style={{ aspectRatio: ratio }} />;
            return (
              <div key={it.id} className="text-center">
                {it.link ? <BqLink href={it.link} ariaLabel={it.title}>{img}</BqLink> : img}
                {it.link && !it.linkLabel
                  ? <BqLink href={it.link} className="bq-h bq-upper block mt-6 sm:mt-7" style={{ fontSize: cols === 2 ? 26 : 20 }}>{it.title}</BqLink>
                  : <h3 className="bq-h bq-upper mt-3 mb-0" style={{ fontSize: cols === 2 ? 26 : 20 }}>{it.title}</h3>}
                {it.description && <p className="text-sm text-muted-foreground mt-2 mb-0">{it.description}</p>}
                {it.link && it.linkLabel && <BqLink href={it.link} className="bq-btn mt-5">{it.linkLabel}</BqLink>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
