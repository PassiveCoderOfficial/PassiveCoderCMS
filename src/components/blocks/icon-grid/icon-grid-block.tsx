import React from "react";
import type { IconGridBlockProps } from "@/types/cms";
import { cn } from "@/lib/utils";
import * as LucideIcons from "lucide-react";
import { Box } from "lucide-react";

/** Lucide icon by name, or the item's own image (logo, badge) when set.
 *  size: image size in px (data.imageSize), else the icon's size classes. */
function DynIcon({ name, image, className, size, alt = "" }: { name?: string; image?: string; className?: string; size?: number; alt?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  if (image) return <img src={image} alt={alt} className={cn(className, "object-contain")} style={size ? { width: size, height: size, maxWidth: "100%" } : undefined} />;
  if (!name) return <Box className={className} />;
  const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name];
  return Icon ? <Icon className={className} /> : <Box className={className} />;
}

const SIZE_CLASS = { sm: "w-8 h-8", md: "w-12 h-12", lg: "w-16 h-16" };
const ICON_SIZE = { sm: "w-4 h-4", md: "w-6 h-6", lg: "w-8 h-8" };

const TILE_ICON_SIZE = { sm: "w-10 h-10", md: "w-14 h-14", lg: "w-20 h-20" };
const TILE_ICON_INNER = { sm: "w-5 h-5", md: "w-7 h-7", lg: "w-9 h-9" };
const INLINE_ICON_SIZE = { sm: "w-3.5 h-3.5", md: "w-4 h-4", lg: "w-5 h-5" };

/** Badge box around a sized item image: room for the image plus padding. */
function imgBox(item: { imageUrl?: string }, size?: number): React.CSSProperties | undefined {
  return item.imageUrl && size ? { width: size + 16, height: size + 16 } : undefined;
}

const TILE_FALLBACK_COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-violet-500",
  "bg-cyan-500",
];

/** Column count from tablet up only. Each variant sets its own phone layout
 *  (grid-cols-2 tiles, grid-cols-1 numbered rows); this used to return an
 *  unprefixed "grid-cols-3" that overrode it, forcing 3 cramped columns on a
 *  390px phone for every 3-column icon grid. */
function colClassFor(columns: 2 | 3 | 4 | 5 | 6): string {
  const colClass: Record<number, string> = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-4",
    5: "sm:grid-cols-3 lg:grid-cols-5",
    6: "sm:grid-cols-3 lg:grid-cols-6",
  };
  return colClass[columns] ?? "sm:grid-cols-2 lg:grid-cols-4";
}

function IconGridColoredTiles({ block }: { block: IconGridBlockProps }) {
  const { data } = block;
  const { title, subtitle, columns, items, iconSize, imageSize } = data;

  return (
    <div className="max-w-6xl mx-auto">
      {(title || subtitle) && (
        <div className="text-center mb-10">
          {title && <h2 className="text-3xl font-bold mb-3">{title}</h2>}
          {subtitle && <p className="text-lg text-muted-foreground">{subtitle}</p>}
        </div>
      )}
      <div className={cn("grid grid-cols-2 gap-6", colClassFor(columns))}>
        {items.map((item, i) => {
          const fallback = TILE_FALLBACK_COLORS[i % TILE_FALLBACK_COLORS.length];
          const content = (
            <>
              <div
                className={cn(
                  "rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm",
                  TILE_ICON_SIZE[iconSize],
                  !item.color && (item.tileColor ? "bg-white/20" : fallback),
                )}
                style={item.color || imgBox(item, imageSize) ? { ...(item.color ? { backgroundColor: item.color } : {}), ...imgBox(item, imageSize) } : undefined}
              >
                <DynIcon name={item.icon} image={item.imageUrl} size={imageSize} className={cn(TILE_ICON_INNER[iconSize], "text-white")} />
              </div>
              <p className="text-sm font-bold text-center text-white">{item.label}</p>
              {item.description && (
                <p className="text-xs text-white/80 text-center mt-1">{item.description}</p>
              )}
            </>
          );

          const tileBg = item.tileColor || item.color || undefined;
          const tileClass = cn(
            "flex flex-col items-center py-8 px-4 rounded-2xl transition-transform hover:-translate-y-1",
            !tileBg && fallback,
          );

          return item.url ? (
            <a key={item.id} href={item.url} className={tileClass} style={tileBg ? { backgroundColor: tileBg } : undefined}>
              {content}
            </a>
          ) : (
            <div key={item.id} className={tileClass} style={tileBg ? { backgroundColor: tileBg } : undefined}>
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function IconGridMinimalInline({ block }: { block: IconGridBlockProps }) {
  const { data } = block;
  const { title, subtitle, items, iconSize, imageSize, showDescriptions } = data;

  return (
    <div className="max-w-6xl mx-auto">
      {(title || subtitle) && (
        <div className="text-center mb-8">
          {title && <h2 className="text-3xl font-bold mb-3">{title}</h2>}
          {subtitle && <p className="text-lg text-muted-foreground">{subtitle}</p>}
        </div>
      )}
      <div className="flex flex-wrap justify-center gap-3">
        {items.map(item => {
          const content = (
            <>
              <span style={item.color ? { color: item.color } : undefined}>
                <DynIcon name={item.icon} image={item.imageUrl} size={imageSize} className={cn(INLINE_ICON_SIZE[iconSize], !item.color && "text-primary")} />
              </span>
              {showDescriptions && item.description ? (
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{item.label}</span>
                  <span className="block text-xs text-muted-foreground mt-0.5 whitespace-pre-line">{item.description}</span>
                </span>
              ) : <span className="text-sm font-medium">{item.label}</span>}
            </>
          );

          const pillClass = cn("inline-flex items-center gap-2 px-4 py-2 border bg-background hover:bg-muted/50 transition-colors",
            showDescriptions && item.description ? "rounded-2xl text-left max-w-sm" : "rounded-full");

          return item.url ? (
            <a key={item.id} href={item.url} className={pillClass}>
              {content}
            </a>
          ) : (
            <div key={item.id} className={pillClass}>
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function IconGridLegacy({ block }: { block: IconGridBlockProps }) {
  const { data } = block;
  const { title, subtitle, columns, items, style, iconSize, imageSize } = data;

  return (
    <div className="max-w-6xl mx-auto">
      {(title || subtitle) && (
        <div className="text-center mb-10">
          {title && <h2 className="text-3xl font-bold mb-3">{title}</h2>}
          {subtitle && <p className="text-lg text-muted-foreground">{subtitle}</p>}
        </div>
      )}
      <div className={cn("grid grid-cols-2 gap-6", colClassFor(columns))}>
        {items.map(item => {
          const iconBg = item.color ? `${item.color}20` : undefined;
          const iconColor = item.color ?? undefined;
          const content = (
            <>
              <div
                className={cn("rounded-xl flex items-center justify-center mx-auto mb-3", SIZE_CLASS[iconSize])}
                style={style === "colored" || imgBox(item, imageSize) ? { ...(style === "colored" ? { backgroundColor: iconBg } : {}), ...imgBox(item, imageSize) } : undefined}
              >
                <span style={{ color: iconColor }}>
                  <DynIcon name={item.icon} image={item.imageUrl} size={imageSize} className={cn(ICON_SIZE[iconSize])} />
                </span>
              </div>
              <p className="text-sm font-semibold text-center">{item.label}</p>
              {item.description && <p className="text-xs text-muted-foreground text-center mt-1">{item.description}</p>}
            </>
          );

          return item.url ? (
            <a key={item.id} href={item.url} className={cn(
              "flex flex-col items-center py-5 px-3 rounded-xl transition-colors hover:bg-muted/50",
              style === "card" && "bg-card border shadow-sm hover:shadow-md",
            )}>
              {content}
            </a>
          ) : (
            <div key={item.id} className={cn(
              "flex flex-col items-center py-5 px-3 rounded-xl",
              style === "card" && "bg-card border shadow-sm",
            )}>
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function IconGridHead({ title, subtitle }: { title?: string; subtitle?: string }) {
  if (!title && !subtitle) return null;
  return (
    <div className="text-center mb-10">
      {title && <h2 className="text-3xl font-bold mb-3">{title}</h2>}
      {subtitle && <p className="text-lg text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

/** Wraps an item in a link only when it has a url, so non-linked items don't
 *  render as clickable. */
function MaybeLink({ url, className, children }: { url?: string; className?: string; children: React.ReactNode }) {
  if (!url) return <div className={className}>{children}</div>;
  return <a href={url} className={className}>{children}</a>;
}

// ─── Variant: outlined-cards ──────────────────────────────────────────────────
// Hairline-bordered cards with the icon inline beside the label — calm and
// structured, suits professional and B2B contexts.
function IconGridOutlinedCards({ block }: { block: IconGridBlockProps }) {
  const { title, subtitle, columns, items } = block.data;
  return (
    <div className="max-w-6xl mx-auto">
      <IconGridHead title={title} subtitle={subtitle} />
      <div className={cn("grid gap-3", items.some((i) => i.thumbUrl) ? "grid-cols-1" : "grid-cols-2", colClassFor(columns))}>
        {items.map((item) => (
          <MaybeLink key={item.id} url={item.url} className={cn("flex items-start gap-3 rounded-xl border bg-card transition-colors hover:border-primary/50 overflow-hidden", item.thumbUrl ? "pe-4" : "p-4")}>
            {item.thumbUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <span className="relative self-stretch w-1/2 min-h-[7.5rem] shrink-0 overflow-hidden"><img src={item.thumbUrl} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" /></span>
            )}
            {!item.thumbUrl && <DynIcon name={item.icon} image={item.imageUrl} size={block.data.imageSize} className="h-5 w-5 shrink-0 text-primary mt-0.5" />}
            <div className={cn("min-w-0", item.thumbUrl && "flex-1 self-center py-3")}>
              <p className="font-semibold text-sm leading-tight">{item.label}</p>
              {item.description && <p className="text-xs text-muted-foreground leading-relaxed mt-1">{item.description}</p>}
            </div>
          </MaybeLink>
        ))}
      </div>
    </div>
  );
}

// ─── Variant: circle-icons ────────────────────────────────────────────────────
// Circular icon badges above centered labels — friendly and approachable.
function IconGridCircleIcons({ block }: { block: IconGridBlockProps }) {
  const { title, subtitle, columns, items } = block.data;
  return (
    <div className="max-w-6xl mx-auto">
      <IconGridHead title={title} subtitle={subtitle} />
      <div className={cn("grid grid-cols-2 gap-8", colClassFor(columns))}>
        {items.map((item) => (
          <MaybeLink key={item.id} url={item.url} className="flex flex-col items-center text-center group">
            <span
              className="mb-3 flex h-16 w-16 items-center justify-center rounded-full transition-transform group-hover:scale-105"
              style={{ backgroundColor: item.color ? `${item.color}1a` : undefined, ...imgBox(item, block.data.imageSize) }}
            >
              <DynIcon name={item.icon} image={item.imageUrl} size={block.data.imageSize} className={cn("h-7 w-7", !item.color && "text-primary")} />
            </span>
            <p className="font-semibold text-sm">{item.label}</p>
            {item.description && <p className="text-xs text-muted-foreground leading-relaxed mt-1">{item.description}</p>}
          </MaybeLink>
        ))}
      </div>
    </div>
  );
}

// ─── Variant: dark-tiles ──────────────────────────────────────────────────────
// Lifted tiles on dark surfaces with an accent icon.
function IconGridDarkTiles({ block }: { block: IconGridBlockProps }) {
  const { title, subtitle, columns, items } = block.data;
  return (
    <div className="max-w-6xl mx-auto">
      <IconGridHead title={title} subtitle={subtitle} />
      <div className={cn("grid grid-cols-2 gap-2.5", colClassFor(columns))}>
        {items.map((item) => (
          <MaybeLink key={item.id} url={item.url} className="rounded-xl bg-foreground/5 p-5 text-center transition-colors hover:bg-foreground/10">
            <DynIcon name={item.icon} image={item.imageUrl} size={block.data.imageSize} className="h-6 w-6 mx-auto mb-2.5 text-primary" />
            <p className="font-medium text-sm">{item.label}</p>
            {item.description && <p className="text-xs text-muted-foreground leading-relaxed mt-1">{item.description}</p>}
          </MaybeLink>
        ))}
      </div>
    </div>
  );
}

// ─── Variant: bordered-matrix ─────────────────────────────────────────────────
// Cells divided by hairlines into a single continuous grid — dense, technical,
// good for capability or coverage lists.
function IconGridBorderedMatrix({ block }: { block: IconGridBlockProps }) {
  const { title, subtitle, columns, items } = block.data;
  return (
    <div className="max-w-6xl mx-auto">
      <IconGridHead title={title} subtitle={subtitle} />
      <div className={cn("grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border", colClassFor(columns))}>
        {items.map((item) => (
          <MaybeLink key={item.id} url={item.url} className="bg-card p-5 text-center transition-colors hover:bg-muted/50">
            <DynIcon name={item.icon} image={item.imageUrl} size={block.data.imageSize} className="h-5 w-5 mx-auto mb-2 text-primary" />
            <p className="text-xs font-medium leading-tight">{item.label}</p>
            {block.data.showDescriptions && item.description && <p className="text-xs text-muted-foreground leading-relaxed mt-1">{item.description}</p>}
          </MaybeLink>
        ))}
      </div>
    </div>
  );
}

// ─── Variant: pill-row ────────────────────────────────────────────────────────
// Icons and labels as wrapping pills — compact, reads as tags rather than a
// grid. Good for long lists of small capabilities.
function IconGridPillRow({ block }: { block: IconGridBlockProps }) {
  const { title, subtitle, items } = block.data;
  return (
    <div className="max-w-4xl mx-auto">
      <IconGridHead title={title} subtitle={subtitle} />
      <div className="flex flex-wrap justify-center gap-2">
        {items.map((item) => (
          <MaybeLink
            key={item.id}
            url={item.url}
            className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3.5 py-2 text-sm transition-colors hover:border-primary/50"
          >
            <DynIcon name={item.icon} image={item.imageUrl} className="h-3.5 w-3.5 text-primary" />
            <span className="font-medium">{item.label}</span>
          </MaybeLink>
        ))}
      </div>
    </div>
  );
}

// ─── Variant: numbered-features ───────────────────────────────────────────────
// Numbered rather than iconed — turns a capability grid into an ordered list
// of reasons or benefits.
function IconGridNumberedFeatures({ block }: { block: IconGridBlockProps }) {
  const { title, subtitle, columns, items } = block.data;
  return (
    <div className="max-w-6xl mx-auto">
      <IconGridHead title={title} subtitle={subtitle} />
      <div className={cn("grid grid-cols-1 gap-6", colClassFor(columns))}>
        {items.map((item, i) => (
          <MaybeLink key={item.id} url={item.url} className="flex gap-3">
            <span className="shrink-0 text-lg font-bold text-primary/40 tabular-nums leading-none pt-0.5">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <p className="font-semibold text-sm leading-tight">{item.label}</p>
              {item.description && <p className="text-xs text-muted-foreground leading-relaxed mt-1">{item.description}</p>}
            </div>
          </MaybeLink>
        ))}
      </div>
    </div>
  );
}

/** Logo-strip tile widths: same per-breakpoint counts as colClassFor, minus the
 *  gap-6 share, so a short last row centres instead of hanging left. */
function logoWidthFor(columns: 2 | 3 | 4 | 5 | 6): string {
  const w: Record<number, string> = {
    2: "w-[calc(50%-12px)]",
    3: "w-[calc(50%-12px)] sm:w-[calc(33.333%-16px)]",
    4: "w-[calc(50%-12px)] lg:w-[calc(25%-18px)]",
    5: "w-[calc(50%-12px)] sm:w-[calc(33.333%-16px)] lg:w-[calc(20%-19.2px)]",
    6: "w-[calc(50%-12px)] sm:w-[calc(33.333%-16px)] lg:w-[calc(16.666%-20px)]",
  };
  return w[columns] ?? w[4];
}

/** Logo strip: partner / accreditation logos at a readable size, label under
 *  each. Uses the item image; falls back to the icon when no image is set. */
function IconGridLogoStrip({ block }: { block: IconGridBlockProps }) {
  const { title, subtitle, columns, items } = block.data;
  const itemW = logoWidthFor(columns);
  return (
    <div className="max-w-6xl mx-auto">
      {(title || subtitle) && (
        <div className="text-center mb-10">
          {title && <h2 className="text-3xl font-bold mb-3">{title}</h2>}
          {subtitle && <p className="text-lg text-muted-foreground">{subtitle}</p>}
        </div>
      )}
      <div className="flex flex-wrap justify-center gap-6 items-start">
        {items.map((item) => {
          const inner = (
            <>
              <div className="h-24 sm:h-28 flex items-center justify-center rounded-2xl bg-white border border-border/60 p-4 shadow-sm">
                <DynIcon name={item.icon} image={item.imageUrl} alt={item.label ?? ""} className={item.imageUrl ? "max-h-full max-w-full" : "h-10 w-10 text-primary"} />
              </div>
              {item.label && <p className="mt-3 text-sm font-semibold text-center">{item.label}</p>}
              {item.description && <p className="mt-1 text-xs text-muted-foreground text-center">{item.description}</p>}
            </>
          );
          return item.url
            ? <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer" className={cn("block hover:opacity-90 transition-opacity", itemW)}>{inner}</a>
            : <div key={item.id} className={itemW}>{inner}</div>;
        })}
      </div>
    </div>
  );
}

/** Grouped list: each item is a group (e.g. a building or sector), its
 *  description holds the names, one per line, shown in tidy columns. Built for
 *  long client lists that read badly as icon cards. */
function IconGridGroupedList({ block }: { block: IconGridBlockProps }) {
  const { title, subtitle, columns, items } = block.data;
  return (
    <div className="max-w-6xl mx-auto">
      {(title || subtitle) && (
        <div className="text-center mb-10">
          {title && <h2 className="text-3xl font-bold mb-3">{title}</h2>}
          {subtitle && <p className="text-lg text-muted-foreground">{subtitle}</p>}
        </div>
      )}
      <div className={cn("grid grid-cols-1 gap-5", colClassFor(columns))}>
        {items.map((item) => {
          const names = (item.description ?? "").split("\n").map((n) => n.replace(/^[•\-*]\s*/, "").trim()).filter(Boolean);
          return (
            <div key={item.id} className="rounded-2xl border bg-card text-card-foreground p-5">
              <div className="flex items-center gap-2.5 mb-3">
                <span style={item.color ? { color: item.color } : undefined}><DynIcon name={item.icon} image={item.imageUrl} className={cn("h-5 w-5", !item.color && "text-primary")} /></span>
                <h3 className="font-semibold">{item.label}</h3>
                {names.length > 0 && !block.data.hideCount && <span className="ml-auto text-xs text-muted-foreground">{names.length}</span>}
              </div>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {names.map((n) => <li key={n} className="flex gap-2 break-words"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-current opacity-60" />{n}</li>)}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function IconGridBlock({ block }: { block: IconGridBlockProps }) {
  // Descriptions keep the author's line breaks ("• item" lists) and long
  // words such as email addresses wrap instead of overflowing on phones.
  return <div className="[&_p]:whitespace-pre-line [&_p]:break-words"><IconGridVariant block={block} /></div>;
}

function IconGridVariant({ block }: { block: IconGridBlockProps }) {
  switch (block.templateVariant) {
    case "grouped-list": return <IconGridGroupedList block={block} />;
    case "logo-strip": return <IconGridLogoStrip block={block} />;
    case "colored-tiles": return <IconGridColoredTiles block={block} />;
    case "minimal-inline": return <IconGridMinimalInline block={block} />;
    case "outlined-cards": return <IconGridOutlinedCards block={block} />;
    case "circle-icons": return <IconGridCircleIcons block={block} />;
    case "dark-tiles": return <IconGridDarkTiles block={block} />;
    case "bordered-matrix": return <IconGridBorderedMatrix block={block} />;
    case "pill-row": return <IconGridPillRow block={block} />;
    case "numbered-features": return <IconGridNumberedFeatures block={block} />;
  }
  return <IconGridLegacy block={block} />;
}
