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
  if (data.tileStyle === "overlay") return <OverlayTiles data={data} />;
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

/**
 * Overlay: tall photos with the caption in white across the top and a pill
 * button at the bottom, both on the image (department-store collection grid).
 * Button colour = Colours → Accent (default black).
 */
function OverlayTiles({ data }: { data: ServicesBlockProps["data"] }) {
  const cols = data.columns ?? 4;
  const ratio = RATIO[data.tileRatio ?? "portrait"];
  const grid = cols === 2 ? "sm:grid-cols-2" : cols === 3 ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-4";
  return (
    <div className="bq" style={bqStyle(data.colors)}>
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6">
        {data.title && <h2 className="text-center uppercase m-0 mb-5 text-[18px] font-normal">{data.title}</h2>}
        {data.subtitle && <p className="text-center text-sm text-muted-foreground m-0 mb-6">{data.subtitle}</p>}
        <div className={cn("grid grid-cols-1 gap-[30px]", grid)}>
          {data.items.map((it) => {
            const tile = (
              <div className="relative overflow-hidden group" style={{ aspectRatio: ratio }}>
                {it.imageUrl
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={it.imageUrl} alt={it.title} loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
                  : <div className="absolute inset-0 bg-muted" />}
                <div className="absolute inset-0 flex flex-col items-center justify-between py-[12%] px-4 text-center">
                  <h3 className="m-0 text-white uppercase tracking-[.08em] text-[14px] font-semibold drop-shadow">{it.title}</h3>
                  {it.linkLabel && <span className="rounded-full px-5 py-2.5 text-[14px] uppercase text-white" style={{ background: data.colors?.accent ?? "#000" }}>{it.linkLabel}</span>}
                </div>
              </div>
            );
            return <div key={it.id}>{it.link ? <BqLink href={it.link} ariaLabel={it.title}>{tile}</BqLink> : tile}</div>;
          })}
        </div>
      </div>
    </div>
  );
}
