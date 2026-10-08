import React from "react";
import { WIDE_COLS } from "./wide-cols";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ServicesBlockProps, ServiceItem } from "@/types/cms";
import { cn } from "@/lib/utils";
import { scStyle } from "@/components/blocks/_primitives/showcase";

type D = ServicesBlockProps["data"];

/**
 * Bento placement for n items on a 4-column grid: the first item is a 2x2
 * lead tile, the second a wide tile, the rest single tiles, and the last tile
 * stretches to close any gap in its row. Works for any count.
 */
function bentoSpan(i: number, n: number): { col: number; row: number } {
  if (n === 1) return { col: 4, row: 2 };
  if (i === 0) return { col: 2, row: 2 };
  if (n === 2) return { col: 2, row: 2 };
  if (i === 1) return { col: 2, row: 1 };
  if (n === 3) return { col: 2, row: 1 };
  if (i < 4) return { col: 1, row: 1 };
  const extra = n - 4, r = extra % 4;
  if (i === n - 1 && r) return { col: 4 - r + 1, row: 1 };
  return { col: 1, row: 1 };
}

function Heading({ data }: { data: D }) {
  if (!data.title && !data.subtitle && !data.eyebrow) return null;
  return (
    <div className="grid gap-4 lg:grid-cols-2 lg:gap-10 items-end mb-10" data-reveal>
      <div>
        {data.eyebrow && <span className="sc-eyebrow mb-3">{data.eyebrow}</span>}
        {data.title && <h2 className="text-3xl sm:text-4xl lg:text-[2.8rem] font-extrabold leading-[1.08] tracking-tight text-foreground">{data.title}</h2>}
      </div>
      {data.subtitle && <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">{data.subtitle}</p>}
    </div>
  );
}

function Tile({ item, big, small, hideSmallText }: { item: ServiceItem; big?: boolean; small?: boolean; hideSmallText?: boolean }) {
  const body = (
    <>
      {item.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.imageUrl} alt={item.title} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
      )}
      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, color-mix(in srgb, var(--sc-dark-c) 96%, transparent) 0%, color-mix(in srgb, var(--sc-dark-c) 60%, transparent) 55%, color-mix(in srgb, var(--sc-dark-c) 5%, transparent) 100%)" }} />
      <div className="absolute inset-x-0 bottom-0 z-[1] p-5 sm:p-6">
        {item.kicker && <span className="block text-[11px] font-extrabold uppercase tracking-[.18em] sc-accent">{item.kicker}</span>}
        <h3 className={cn("font-extrabold text-white mt-1 mb-1.5", big ? "text-3xl sm:text-4xl" : "text-xl sm:text-2xl")}>{item.title}</h3>
        {item.description && !(small && hideSmallText) && <p className="text-sm text-white/75 leading-relaxed max-w-md">{item.description}</p>}
        {item.link && <span className="inline-flex items-center gap-2 text-white font-bold text-sm mt-3">{item.linkLabel || "Explore"} <ArrowRight className="w-4 h-4" /></span>}
      </div>
    </>
  );
  const cls = "sc-zoom sc-dark-bg relative block h-full overflow-hidden rounded-[calc(var(--radius)+10px)]";
  return item.link ? <Link href={item.link} className={cls}>{body}</Link> : <div className={cls}>{body}</div>;
}

/** Mixed-size photo tiles: one lead tile, a wide tile, then the rest. */
export function ServicesBento({ data }: { data: D }) {
  const items = data.items ?? [];
  const n = items.length;
  return (
    <div className="sc-root max-w-7xl mx-auto" style={scStyle(data.colors)}>
      <Heading data={data} />
      <div className="grid gap-4 sm:gap-[18px] grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 auto-rows-[240px] lg:auto-rows-[250px]">
        {items.map((item, i) => {
          const { col, row } = bentoSpan(i, n);
          return (
            <div key={item.id} data-reveal
              className={cn(
                col >= 2 && "sm:col-span-2",
                col === 3 && "lg:col-span-3",
                col === 4 && "lg:col-span-4",
                row === 2 && "lg:row-span-2",
              )}>
              <Tile item={item} big={i === 0} small={col === 1} hideSmallText={data.hideSmallText} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Portrait photo cards with kicker and title overlaid — a "more services" row. */
export function ServicesPhotoCards({ data }: { data: D }) {
  const items = data.items ?? [];
  const cols = ({ ...{ 2: "sm:grid-cols-2", 3: "sm:grid-cols-2 lg:grid-cols-3", 4: "grid-cols-2 lg:grid-cols-4" }, ...WIDE_COLS } as Record<number, string>)[data.columns] ?? "grid-cols-2 lg:grid-cols-4";
  return (
    <div className="sc-root max-w-7xl mx-auto" style={scStyle(data.colors)}>
      {(data.title || data.eyebrow) && (
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            {data.eyebrow && <span className="sc-eyebrow mb-2">{data.eyebrow}</span>}
            {data.title && <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">{data.title}</h2>}
          </div>
          {data.allLink?.url && (
            <Link href={data.allLink.url} className="text-primary font-bold text-sm inline-flex items-center gap-2 whitespace-nowrap">
              {data.allLink.label || "View all"} <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      )}
      {data.subtitle && <p className="text-muted-foreground -mt-3 mb-6">{data.subtitle}</p>}
      <div className={cn("grid gap-4", cols)}>
        {items.map((item) => {
          const inner = (
            <>
              {item.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.imageUrl} alt={item.title} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
              )}
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,.88) 0%, rgba(0,0,0,.45) 35%, transparent 62%)" }} />
              <span className="absolute inset-x-4 bottom-4 z-[1] text-white">
                {item.kicker && <small className="block text-[10px] font-bold uppercase tracking-[.16em] sc-accent mb-1">{item.kicker}</small>}
                <b className="text-lg font-extrabold leading-tight" style={{ fontFamily: "var(--heading-font)" }}>{item.title}</b>
              </span>
            </>
          );
          const cls = "sc-zoom sc-dark-bg relative block aspect-[4/5] overflow-hidden rounded-[calc(var(--radius)+8px)]";
          return item.link
            ? <Link key={item.id} href={item.link} className={cls} data-reveal>{inner}</Link>
            : <div key={item.id} className={cls} data-reveal>{inner}</div>;
        })}
      </div>
    </div>
  );
}
