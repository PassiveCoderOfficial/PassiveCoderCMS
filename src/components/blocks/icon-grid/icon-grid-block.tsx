import React from "react";
import type { IconGridBlockProps } from "@/types/cms";
import { cn } from "@/lib/utils";
import * as LucideIcons from "lucide-react";
import { Box } from "lucide-react";

function DynIcon({ name, className }: { name?: string; className?: string }) {
  if (!name) return <Box className={className} />;
  const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name];
  return Icon ? <Icon className={className} /> : <Box className={className} />;
}

const SIZE_CLASS = { sm: "w-8 h-8", md: "w-12 h-12", lg: "w-16 h-16" };
const ICON_SIZE = { sm: "w-4 h-4", md: "w-6 h-6", lg: "w-8 h-8" };

const TILE_ICON_SIZE = { sm: "w-10 h-10", md: "w-14 h-14", lg: "w-20 h-20" };
const TILE_ICON_INNER = { sm: "w-5 h-5", md: "w-7 h-7", lg: "w-9 h-9" };
const INLINE_ICON_SIZE = { sm: "w-3.5 h-3.5", md: "w-4 h-4", lg: "w-5 h-5" };

const TILE_FALLBACK_COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-violet-500",
  "bg-cyan-500",
];

function colClassFor(columns: 3 | 4 | 5 | 6): string {
  const colClass: Record<number, string> = {
    3: "grid-cols-3",
    4: "sm:grid-cols-4",
    5: "grid-cols-3 sm:grid-cols-5",
    6: "grid-cols-3 sm:grid-cols-6",
  };
  return colClass[columns] ?? "grid-cols-4";
}

function IconGridColoredTiles({ block }: { block: IconGridBlockProps }) {
  const { data } = block;
  const { title, subtitle, columns, items, iconSize } = data;

  return (
    <div className="max-w-6xl mx-auto">
      {(title || subtitle) && (
        <div className="text-center mb-10">
          {title && <h2 className="text-3xl font-bold mb-3">{title}</h2>}
          {subtitle && <p className="text-lg text-muted-foreground">{subtitle}</p>}
        </div>
      )}
      <div className={cn("grid gap-6", colClassFor(columns))}>
        {items.map((item, i) => {
          const fallback = TILE_FALLBACK_COLORS[i % TILE_FALLBACK_COLORS.length];
          const content = (
            <>
              <div
                className={cn(
                  "rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm",
                  TILE_ICON_SIZE[iconSize],
                  !item.color && fallback,
                )}
                style={item.color ? { backgroundColor: item.color } : undefined}
              >
                <DynIcon name={item.icon} className={cn(TILE_ICON_INNER[iconSize], "text-white")} />
              </div>
              <p className="text-sm font-bold text-center text-white">{item.label}</p>
              {item.description && (
                <p className="text-xs text-white/80 text-center mt-1">{item.description}</p>
              )}
            </>
          );

          const tileBg = item.color ?? undefined;
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
  const { title, subtitle, items, iconSize } = data;

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
                <DynIcon name={item.icon} className={cn(INLINE_ICON_SIZE[iconSize], !item.color && "text-primary")} />
              </span>
              <span className="text-sm font-medium">{item.label}</span>
            </>
          );

          const pillClass = "inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-background hover:bg-muted/50 transition-colors";

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
  const { title, subtitle, columns, items, style, iconSize } = data;

  return (
    <div className="max-w-6xl mx-auto">
      {(title || subtitle) && (
        <div className="text-center mb-10">
          {title && <h2 className="text-3xl font-bold mb-3">{title}</h2>}
          {subtitle && <p className="text-lg text-muted-foreground">{subtitle}</p>}
        </div>
      )}
      <div className={cn("grid gap-6", colClassFor(columns))}>
        {items.map(item => {
          const iconBg = item.color ? `${item.color}20` : undefined;
          const iconColor = item.color ?? undefined;
          const content = (
            <>
              <div
                className={cn("rounded-xl flex items-center justify-center mx-auto mb-3", SIZE_CLASS[iconSize])}
                style={style === "colored" ? { backgroundColor: iconBg } : undefined}
              >
                <span style={{ color: iconColor }}>
                  <DynIcon name={item.icon} className={cn(ICON_SIZE[iconSize])} />
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
      <div className={cn("grid grid-cols-2 gap-3", colClassFor(columns))}>
        {items.map((item) => (
          <MaybeLink key={item.id} url={item.url} className="flex items-start gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-primary/50">
            <DynIcon name={item.icon} className="h-5 w-5 shrink-0 text-primary mt-0.5" />
            <div className="min-w-0">
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
              style={{ backgroundColor: item.color ? `${item.color}1a` : undefined }}
            >
              <DynIcon name={item.icon} className={cn("h-7 w-7", !item.color && "text-primary")} />
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
            <DynIcon name={item.icon} className="h-6 w-6 mx-auto mb-2.5 text-primary" />
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
            <DynIcon name={item.icon} className="h-5 w-5 mx-auto mb-2 text-primary" />
            <p className="text-xs font-medium leading-tight">{item.label}</p>
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
            <DynIcon name={item.icon} className="h-3.5 w-3.5 text-primary" />
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

export function IconGridBlock({ block }: { block: IconGridBlockProps }) {
  switch (block.templateVariant) {
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
