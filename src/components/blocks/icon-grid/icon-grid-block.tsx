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
              style === "card" && "bg-white border shadow-sm hover:shadow-md",
            )}>
              {content}
            </a>
          ) : (
            <div key={item.id} className={cn(
              "flex flex-col items-center py-5 px-3 rounded-xl",
              style === "card" && "bg-white border shadow-sm",
            )}>
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function IconGridBlock({ block }: { block: IconGridBlockProps }) {
  const variant = block.templateVariant;
  if (variant === "colored-tiles") return <IconGridColoredTiles block={block} />;
  if (variant === "minimal-inline") return <IconGridMinimalInline block={block} />;
  return <IconGridLegacy block={block} />;
}
