import React from "react";
import { cn } from "@/lib/utils";
import type { VariantThumbKind } from "@/modules/page-builder/block-variants";

/**
 * CSS-only silhouettes for the block variant picker — same idea as
 * `PresetThumbnail`, but keyed to layout variants rather than section presets.
 * Deliberately abstract: this conveys structure (split? grid? banner?), not a
 * live render, so it stays legible at ~90px wide.
 *
 * `dark` renders the silhouette on an inverted surface, matching variants that
 * are designed for dark palettes.
 */

function Bar({ w = "full", h = "sm", tone = "muted", dark }: {
  w?: "full" | "3/4" | "2/3" | "1/2" | "1/3" | "1/4";
  h?: "xs" | "sm" | "md";
  tone?: "muted" | "primary";
  dark?: boolean;
}) {
  const wCls = { full: "w-full", "3/4": "w-3/4", "2/3": "w-2/3", "1/2": "w-1/2", "1/3": "w-1/3", "1/4": "w-1/4" }[w];
  const hCls = { xs: "h-0.5", sm: "h-1", md: "h-1.5" }[h];
  return (
    <div className={cn(
      "rounded-full", wCls, hCls,
      tone === "primary" ? "bg-primary/60" : dark ? "bg-white/25" : "bg-muted-foreground/25",
    )} />
  );
}

function Box({ className, dark }: { className?: string; dark?: boolean }) {
  return (
    <div className={cn(
      "rounded",
      dark ? "bg-white/10 border border-white/15" : "bg-muted-foreground/10 border border-muted-foreground/20",
      className,
    )} />
  );
}

function Dot({ dark }: { dark?: boolean }) {
  return <div className={cn("rounded-full h-2 w-2 shrink-0", dark ? "bg-white/30" : "bg-muted-foreground/30")} />;
}

export function VariantThumbnail({ kind, dark }: { kind: VariantThumbKind; dark?: boolean }) {
  return (
    <div className={cn(
      "w-full aspect-[16/10] rounded-md border overflow-hidden p-2 flex flex-col justify-center gap-1",
      dark ? "bg-zinc-900 border-zinc-700" : "bg-muted/40",
    )}>
      {(() => {
        switch (kind) {
          // ── Hero ──────────────────────────────────────────────────────
          case "split-image":
            return (
              <div className="flex h-full items-center gap-1.5">
                <div className="flex-1 space-y-1">
                  <Bar w="1/2" h="xs" tone="primary" />
                  <Bar w="full" h="md" dark={dark} />
                  <Bar w="2/3" h="xs" dark={dark} />
                </div>
                <Box className="flex-1 self-stretch" dark={dark} />
              </div>
            );
          case "fullscreen":
            return (
              <div className={cn(
                "h-full rounded flex flex-col items-center justify-center gap-1",
                dark ? "bg-white/10" : "bg-muted-foreground/20",
              )}>
                <Bar w="1/2" h="md" dark={dark} />
                <Bar w="1/3" h="xs" dark={dark} />
                <div className="h-2 w-8 rounded-full bg-primary/60 mt-0.5" />
              </div>
            );
          case "centered":
            return (
              <div className="h-full flex flex-col items-center justify-center gap-1">
                <Bar w="1/3" h="xs" tone="primary" />
                <Bar w="3/4" h="md" dark={dark} />
                <Bar w="1/2" h="xs" dark={dark} />
                <div className="h-2 w-8 rounded-full bg-primary/60 mt-0.5" />
              </div>
            );
          case "gradient-left":
            return (
              <div className="flex h-full gap-1.5">
                <div className={cn(
                  "flex-1 rounded p-1.5 flex flex-col justify-center gap-1",
                  dark ? "bg-gradient-to-br from-white/20 to-white/5" : "bg-gradient-to-br from-muted-foreground/30 to-muted-foreground/10",
                )}>
                  <Bar w="full" h="md" dark={dark} />
                  <Bar w="2/3" h="xs" dark={dark} />
                </div>
                <Box className="w-1/3 self-stretch" dark={dark} />
              </div>
            );
          case "corporate":
            return (
              <div className="h-full flex flex-col justify-center gap-1.5">
                <div className="flex gap-1.5 items-center">
                  <div className="flex-1 space-y-1">
                    <Bar w="2/3" h="sm" dark={dark} />
                    <Bar w="full" h="xs" dark={dark} />
                  </div>
                  <Box className="w-2/5 h-8" dark={dark} />
                </div>
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => <Box key={i} className="flex-1 h-3" dark={dark} />)}
                </div>
              </div>
            );

          // ── Cards / lists ─────────────────────────────────────────────
          case "cards-grid":
          case "cards-dark":
            return (
              <div className="grid grid-cols-3 gap-1 h-full items-center">
                {[0, 1, 2, 3, 4, 5].map(i => (
                  <div key={i} className={cn(
                    "rounded p-1 space-y-0.5",
                    dark || kind === "cards-dark" ? "bg-white/10" : "bg-muted-foreground/10",
                  )}>
                    <Dot dark={dark || kind === "cards-dark"} />
                    <Bar w="full" h="xs" dark={dark || kind === "cards-dark"} />
                  </div>
                ))}
              </div>
            );
          case "list-rows":
            return (
              <div className="h-full flex flex-col justify-center gap-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className={cn("flex items-center gap-1.5 pb-1", i < 2 && (dark ? "border-b border-white/10" : "border-b border-muted-foreground/15"))}>
                    <Dot dark={dark} />
                    <div className="flex-1 space-y-0.5">
                      <Bar w="1/2" h="xs" dark={dark} />
                      <Bar w="3/4" h="xs" dark={dark} />
                    </div>
                  </div>
                ))}
              </div>
            );
          case "numbered-list":
            return (
              <div className="h-full flex flex-col justify-center gap-1">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className={cn(
                      "text-[7px] font-bold w-3 h-3 rounded-full flex items-center justify-center shrink-0",
                      dark ? "bg-white/15 text-white/60" : "bg-primary/20 text-primary",
                    )}>{i}</span>
                    <Bar w="3/4" h="xs" dark={dark} />
                  </div>
                ))}
              </div>
            );
          case "menu-list":
            return (
              <div className="h-full flex flex-col justify-center gap-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className="flex items-center gap-1.5">
                    <Bar w="1/2" h="xs" dark={dark} />
                    <div className={cn("flex-1 border-b border-dotted", dark ? "border-white/20" : "border-muted-foreground/25")} />
                    <div className="h-1 w-4 rounded-full bg-primary/50" />
                  </div>
                ))}
              </div>
            );
          case "bento":
            return (
              <div className="grid grid-cols-3 grid-rows-2 gap-1 h-full">
                <Box className="col-span-2 row-span-2" dark={dark} />
                <Box dark={dark} />
                <Box dark={dark} />
              </div>
            );

          // ── Testimonials ──────────────────────────────────────────────
          case "quote-cards":
          case "quote-dark":
            return (
              <div className="grid grid-cols-3 gap-1 h-full items-center">
                {[0, 1, 2].map(i => (
                  <div key={i} className={cn(
                    "rounded p-1 space-y-0.5",
                    dark || kind === "quote-dark" ? "bg-white/10" : "bg-muted-foreground/10",
                  )}>
                    <Bar w="full" h="xs" dark={dark || kind === "quote-dark"} />
                    <Bar w="2/3" h="xs" dark={dark || kind === "quote-dark"} />
                    <div className="flex items-center gap-0.5 pt-0.5">
                      <Dot dark={dark || kind === "quote-dark"} />
                      <Bar w="1/2" h="xs" dark={dark || kind === "quote-dark"} />
                    </div>
                  </div>
                ))}
              </div>
            );
          case "quote-wide":
            return (
              <div className="h-full flex flex-col items-center justify-center gap-1 px-2">
                <Bar w="full" h="sm" dark={dark} />
                <Bar w="3/4" h="sm" dark={dark} />
                <div className="flex items-center gap-1 pt-1">
                  <Dot dark={dark} />
                  <Bar w="1/4" h="xs" dark={dark} />
                </div>
              </div>
            );
          case "quote-minimal":
            return (
              <div className="h-full flex flex-col justify-center gap-1.5 px-1">
                <Bar w="full" h="xs" dark={dark} />
                <Bar w="3/4" h="xs" dark={dark} />
                <Bar w="1/3" h="xs" tone="primary" />
              </div>
            );

          // ── Stats ─────────────────────────────────────────────────────
          case "stat-row":
          case "stat-dark":
          case "stat-gradient":
            return (
              <div className={cn(
                "h-full rounded flex items-center justify-around px-1",
                kind === "stat-dark" ? "bg-white/10" : kind === "stat-gradient" ? "bg-gradient-to-r from-primary/25 to-primary/5" : "bg-primary/10",
              )}>
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className="flex flex-col items-center gap-0.5">
                    <div className={cn("h-2 w-4 rounded", kind === "stat-gradient" ? "bg-primary/60" : dark || kind === "stat-dark" ? "bg-white/40" : "bg-primary/50")} />
                    <div className={cn("h-0.5 w-5 rounded-full", dark || kind === "stat-dark" ? "bg-white/20" : "bg-muted-foreground/25")} />
                  </div>
                ))}
              </div>
            );

          // ── CTA ───────────────────────────────────────────────────────
          case "banner":
          case "banner-dark":
            return (
              <div className={cn(
                "h-full rounded flex flex-col items-center justify-center gap-1",
                kind === "banner-dark" ? "bg-white/10" : "bg-gradient-to-r from-primary/40 to-primary/20",
              )}>
                <Bar w="1/2" h="md" dark={dark || kind === "banner-dark"} />
                <div className={cn("h-2 w-8 rounded-full", kind === "banner-dark" ? "bg-primary/60" : "bg-white/70")} />
              </div>
            );
          case "split-cta":
            return (
              <div className={cn("h-full rounded flex items-center gap-2 px-2", dark ? "bg-white/10" : "bg-muted-foreground/15")}>
                <div className="flex-1 space-y-0.5">
                  <Bar w="3/4" h="sm" dark={dark} />
                  <Bar w="1/2" h="xs" dark={dark} />
                </div>
                <div className="h-2.5 w-8 rounded-full bg-primary/60 shrink-0" />
              </div>
            );

          // ── Pricing ───────────────────────────────────────────────────
          case "price-cards":
          case "price-dark":
            return (
              <div className="grid grid-cols-3 gap-1 h-full items-center">
                {[0, 1, 2].map(i => (
                  <div key={i} className={cn(
                    "rounded p-1 space-y-0.5 flex flex-col",
                    i === 1 && "ring-1 ring-primary/50 scale-105",
                    dark || kind === "price-dark" ? "bg-white/10" : "bg-muted-foreground/10",
                  )}>
                    <Bar w="1/2" h="xs" dark={dark || kind === "price-dark"} />
                    <div className={cn("h-2 w-2/3 rounded", i === 1 ? "bg-primary/60" : dark || kind === "price-dark" ? "bg-white/30" : "bg-muted-foreground/30")} />
                    <Bar w="full" h="xs" dark={dark || kind === "price-dark"} />
                  </div>
                ))}
              </div>
            );
          case "price-minimal":
            return (
              <div className="h-full flex flex-col justify-center gap-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className="flex items-baseline gap-1.5">
                    <Bar w="1/3" h="xs" dark={dark} />
                    <div className={cn("flex-1 border-b border-dotted", dark ? "border-white/20" : "border-muted-foreground/25")} />
                    <div className="h-1.5 w-4 rounded bg-primary/50" />
                  </div>
                ))}
              </div>
            );

          // ── FAQ ───────────────────────────────────────────────────────
          case "accordion":
            return (
              <div className="h-full flex flex-col justify-center gap-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className={cn(
                    "rounded px-1.5 py-1 flex items-center justify-between gap-1",
                    dark ? "bg-white/10" : "bg-muted-foreground/10",
                    i === 0 && "ring-1 ring-primary/40",
                  )}>
                    <Bar w="2/3" h="xs" dark={dark} />
                    <div className={cn("w-1 h-1 rotate-45 border-r border-b", dark ? "border-white/40" : "border-muted-foreground/40")} />
                  </div>
                ))}
              </div>
            );
          case "two-col":
            return (
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 h-full items-center">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className="space-y-0.5">
                    <Bar w="2/3" h="xs" tone="primary" />
                    <Bar w="full" h="xs" dark={dark} />
                  </div>
                ))}
              </div>
            );

          // ── Team ──────────────────────────────────────────────────────
          case "avatar-cards":
            return (
              <div className="grid grid-cols-3 gap-1 h-full items-center">
                {[0, 1, 2].map(i => (
                  <div key={i} className="flex flex-col items-center gap-0.5">
                    <div className={cn("h-4 w-4 rounded-full", dark ? "bg-white/20" : "bg-muted-foreground/25")} />
                    <Bar w="3/4" h="xs" dark={dark} />
                  </div>
                ))}
              </div>
            );
          case "avatar-list":
            return (
              <div className="h-full flex flex-col justify-center gap-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className={cn("h-3 w-3 rounded-full shrink-0", dark ? "bg-white/20" : "bg-muted-foreground/25")} />
                    <Bar w="1/2" h="xs" dark={dark} />
                  </div>
                ))}
              </div>
            );

          // ── Gallery ───────────────────────────────────────────────────
          case "grid-tight":
            return (
              <div className="grid grid-cols-4 gap-0.5 h-full">
                {Array.from({ length: 8 }).map((_, i) => <Box key={i} dark={dark} />)}
              </div>
            );
          case "masonry":
            return (
              <div className="grid grid-cols-3 gap-1 h-full">
                <div className="space-y-1">
                  <Box className="h-1/3" dark={dark} />
                  <Box className="h-1/2" dark={dark} />
                </div>
                <div className="space-y-1">
                  <Box className="h-1/2" dark={dark} />
                  <Box className="h-1/3" dark={dark} />
                </div>
                <div className="space-y-1">
                  <Box className="h-2/5" dark={dark} />
                  <Box className="h-2/5" dark={dark} />
                </div>
              </div>
            );

          // ── Steps ─────────────────────────────────────────────────────
          case "steps-cards":
            return (
              <div className="grid grid-cols-3 gap-1 h-full items-center">
                {[1, 2, 3].map(i => (
                  <div key={i} className={cn("rounded p-1 space-y-0.5", dark ? "bg-white/10" : "bg-muted-foreground/10")}>
                    <span className={cn(
                      "text-[7px] font-bold w-3 h-3 rounded-full flex items-center justify-center",
                      dark ? "bg-white/20 text-white/70" : "bg-primary/20 text-primary",
                    )}>{i}</span>
                    <Bar w="full" h="xs" dark={dark} />
                  </div>
                ))}
              </div>
            );
          case "steps-timeline":
            return (
              <div className="h-full flex items-center justify-between px-1 relative">
                <div className={cn("absolute left-2 right-2 h-px", dark ? "bg-white/20" : "bg-muted-foreground/25")} />
                {[1, 2, 3].map(i => (
                  <div key={i} className="relative flex flex-col items-center gap-0.5 z-10">
                    <div className={cn(
                      "h-3 w-3 rounded-full flex items-center justify-center text-[6px] font-bold",
                      dark ? "bg-zinc-900 border border-white/30 text-white/70" : "bg-background border border-primary/40 text-primary",
                    )}>{i}</div>
                    <div className={cn("h-0.5 w-5 rounded-full", dark ? "bg-white/20" : "bg-muted-foreground/25")} />
                  </div>
                ))}
              </div>
            );

          // ── Icon grid ─────────────────────────────────────────────────
          case "tiles":
            return (
              <div className="grid grid-cols-4 gap-1 h-full items-center">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="rounded bg-primary/20 aspect-square flex items-center justify-center">
                    <div className="h-1.5 w-1.5 rounded-sm bg-primary/60" />
                  </div>
                ))}
              </div>
            );
          case "inline-icons":
            return (
              <div className="h-full flex flex-wrap content-center gap-x-2 gap-y-1">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-0.5">
                    <Dot dark={dark} />
                    <div className={cn("h-0.5 w-4 rounded-full", dark ? "bg-white/25" : "bg-muted-foreground/25")} />
                  </div>
                ))}
              </div>
            );

          default:
            return <Box className="h-full" dark={dark} />;
        }
      })()}
    </div>
  );
}
