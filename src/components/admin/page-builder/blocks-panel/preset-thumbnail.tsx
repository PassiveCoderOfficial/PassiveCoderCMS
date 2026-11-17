import React from "react";
import { cn } from "@/lib/utils";

/**
 * Tiny CSS-only layout silhouettes for the section-presets picker. Each key
 * maps to a rough visual shape of the section so a user can tell presets
 * apart at a glance instead of reading text-only rows. Deliberately abstract
 * (gray blocks, no real copy) — this is a layout preview, not a live render.
 */
export type PresetThumbKind =
  | "hero-split"
  | "hero-fullscreen"
  | "hero-centered"
  | "cards-3"
  | "cards-6"
  | "pricing-cards"
  | "quote-cards"
  | "stats-row"
  | "feature-checklist"
  | "steps-row"
  | "faq-accordion"
  | "text-center"
  | "avatar-grid"
  | "cta-banner"
  | "form-split"
  | "newsletter-bar"
  | "countdown-bar"
  | "gallery-grid"
  | "video-embed"
  | "slider-dots"
  | "hero-dark-split"
  | "hero-corporate"
  | "bento-grid"
  | "icon-list-cards"
  | "timeline"
  | "numbered-tiles"
  | "avatar-cards"
  | "team-list"
  | "accordion"
  | "faq-grid"
  | "masonry"
  | "gallery-clean"
  | "colored-tiles"
  | "pill-list"
  | "stats-dark"
  | "cta-split"
  | "pricing-dark";

function Bar({ w = "full", h = "sm", tone = "muted" }: { w?: "full" | "2/3" | "1/2" | "1/3"; h?: "xs" | "sm" | "md"; tone?: "muted" | "primary" }) {
  const wCls = { full: "w-full", "2/3": "w-2/3", "1/2": "w-1/2", "1/3": "w-1/3" }[w];
  const hCls = { xs: "h-1", sm: "h-1.5", md: "h-2.5" }[h];
  return <div className={cn("rounded-full", wCls, hCls, tone === "primary" ? "bg-primary/50" : "bg-muted-foreground/20")} />;
}

function Box({ className }: { className?: string }) {
  return <div className={cn("rounded-md bg-muted-foreground/10 border border-muted-foreground/15", className)} />;
}

export function PresetThumbnail({ kind }: { kind: PresetThumbKind }) {
  return (
    <div className="w-full aspect-[16/10] rounded-lg bg-muted/40 border overflow-hidden p-2.5 flex flex-col justify-center gap-1.5">
      {(() => {
        switch (kind) {
          case "hero-split":
            return (
              <div className="flex items-center gap-2 h-full">
                <div className="flex-1 space-y-1.5">
                  <Bar w="1/2" h="xs" tone="primary" />
                  <Bar w="full" h="md" />
                  <Bar w="2/3" h="xs" />
                  <div className="flex gap-1 pt-0.5">
                    <div className="h-2.5 w-8 rounded-full bg-primary/60" />
                    <div className="h-2.5 w-8 rounded-full border border-muted-foreground/25" />
                  </div>
                </div>
                <Box className="flex-1 self-stretch" />
              </div>
            );
          case "hero-fullscreen":
            return (
              <div className="relative h-full rounded-md bg-gradient-to-br from-muted-foreground/25 to-muted-foreground/10 flex flex-col items-center justify-center gap-1.5">
                <Bar w="1/3" h="xs" tone="primary" />
                <Bar w="1/2" h="md" />
                <div className="h-2.5 w-10 rounded-full bg-white/70" />
              </div>
            );
          case "hero-centered":
            return (
              <div className="h-full flex flex-col items-center justify-center gap-1.5">
                <Bar w="1/3" h="xs" tone="primary" />
                <Bar w="2/3" h="md" />
                <Bar w="1/2" h="xs" />
                <div className="h-2.5 w-10 rounded-full bg-primary/60 mt-0.5" />
              </div>
            );
          case "cards-3":
            return (
              <div className="h-full flex flex-col gap-1.5">
                <Bar w="1/3" h="xs" tone="primary" />
                <div className="flex-1 grid grid-cols-3 gap-1.5">
                  <Box /><Box /><Box />
                </div>
              </div>
            );
          case "cards-6":
            return (
              <div className="h-full flex flex-col gap-1.5">
                <Bar w="1/3" h="xs" tone="primary" />
                <div className="flex-1 grid grid-cols-3 grid-rows-2 gap-1">
                  <Box /><Box /><Box /><Box /><Box /><Box />
                </div>
              </div>
            );
          case "pricing-cards":
            return (
              <div className="h-full grid grid-cols-3 gap-1.5 items-stretch">
                <Box />
                <Box className="border-primary/40 bg-primary/10" />
                <Box />
              </div>
            );
          case "quote-cards":
            return (
              <div className="h-full grid grid-cols-3 gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="rounded-md bg-muted-foreground/10 border border-muted-foreground/15 p-1.5 flex flex-col gap-1 justify-center">
                    <Bar w="full" h="xs" />
                    <Bar w="2/3" h="xs" />
                    <div className="h-1.5 w-1.5 rounded-full bg-primary/50 mt-0.5" />
                  </div>
                ))}
              </div>
            );
          case "stats-row":
            return (
              <div className="h-full flex items-center gap-1.5">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="h-2.5 w-6 rounded bg-primary/50" />
                    <Bar w="2/3" h="xs" />
                  </div>
                ))}
              </div>
            );
          case "feature-checklist":
            return (
              <div className="h-full flex flex-col gap-1.5 justify-center">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-primary/40 shrink-0" />
                    <Bar w="2/3" h="xs" />
                  </div>
                ))}
              </div>
            );
          case "steps-row":
            return (
              <div className="h-full flex items-center">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 relative">
                    {i > 0 && <div className="absolute top-2 -left-1/2 w-full h-px bg-muted-foreground/20" />}
                    <div className="h-4 w-4 rounded-full bg-primary/50 flex items-center justify-center z-10" />
                    <Bar w="2/3" h="xs" />
                  </div>
                ))}
              </div>
            );
          case "faq-accordion":
            return (
              <div className="h-full flex flex-col gap-1.5 justify-center">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="rounded border border-muted-foreground/15 px-1.5 py-1 flex items-center justify-between">
                    <Bar w="1/2" h="xs" />
                    <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
                  </div>
                ))}
              </div>
            );
          case "text-center":
            return (
              <div className="h-full flex flex-col items-center justify-center gap-1.5">
                <Bar w="1/3" h="sm" tone="primary" />
                <Bar w="2/3" h="xs" />
                <Bar w="1/2" h="xs" />
                <Bar w="2/3" h="xs" />
              </div>
            );
          case "avatar-grid":
            return (
              <div className="h-full grid grid-cols-3 gap-1.5 items-center justify-items-center">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div className="h-5 w-5 rounded-full bg-primary/40" />
                    <Bar w="2/3" h="xs" />
                  </div>
                ))}
              </div>
            );
          case "cta-banner":
            return (
              <div className="h-full rounded-md bg-primary/15 border border-primary/20 flex flex-col items-center justify-center gap-1.5">
                <Bar w="1/2" h="sm" tone="primary" />
                <div className="h-2.5 w-10 rounded-full bg-primary/60" />
              </div>
            );
          case "form-split":
            return (
              <div className="h-full flex gap-2">
                <div className="flex-1 flex flex-col justify-center gap-1.5">
                  <Bar w="1/2" h="xs" tone="primary" />
                  <Bar w="2/3" h="xs" />
                </div>
                <div className="flex-1 space-y-1">
                  <Box className="h-2" /><Box className="h-2" /><Box className="h-4" />
                </div>
              </div>
            );
          case "newsletter-bar":
            return (
              <div className="h-full rounded-md bg-muted-foreground/10 border border-muted-foreground/15 flex items-center justify-center gap-1.5 px-2">
                <Bar w="1/3" h="xs" />
                <Box className="h-2.5 w-8" />
              </div>
            );
          case "countdown-bar":
            return (
              <div className="h-full flex flex-col items-center justify-center gap-1.5">
                <Bar w="1/2" h="xs" tone="primary" />
                <div className="flex gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="h-3.5 w-3.5 rounded bg-muted-foreground/20" />
                  ))}
                </div>
              </div>
            );
          case "gallery-grid":
            return (
              <div className="h-full grid grid-cols-3 grid-rows-2 gap-1">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="rounded bg-muted-foreground/15" />
                ))}
              </div>
            );
          case "video-embed":
            return (
              <div className="h-full rounded-md bg-muted-foreground/15 flex items-center justify-center">
                <div className="h-0 w-0 border-y-[5px] border-y-transparent border-l-[8px] border-l-primary/60 ml-0.5" />
              </div>
            );
          case "slider-dots":
            return (
              <div className="h-full flex flex-col">
                <Box className="flex-1" />
                <div className="flex justify-center gap-1 pt-1">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className={cn("h-1 w-1 rounded-full", i === 0 ? "bg-primary/60" : "bg-muted-foreground/25")} />
                  ))}
                </div>
              </div>
            );
          case "hero-dark-split":
            return (
              <div className="flex items-center gap-2 h-full rounded-md bg-muted-foreground/20 p-2">
                <div className="flex-1 space-y-1.5">
                  <Bar w="1/2" h="xs" tone="primary" />
                  <Bar w="full" h="md" />
                  <Bar w="2/3" h="xs" />
                </div>
                <Box className="flex-1 self-stretch bg-muted-foreground/25" />
              </div>
            );
          case "hero-corporate":
            return (
              <div className="h-full flex flex-col justify-center gap-1.5 border-l-4 border-primary/50 pl-2">
                <Bar w="1/3" h="xs" tone="primary" />
                <Bar w="2/3" h="md" />
                <Bar w="1/2" h="xs" />
              </div>
            );
          case "bento-grid":
            return (
              <div className="h-full grid grid-cols-3 grid-rows-2 gap-1.5">
                <Box className="col-span-2 row-span-2" />
                <Box /><Box />
              </div>
            );
          case "icon-list-cards":
            return (
              <div className="h-full flex flex-col gap-1.5 justify-center">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-1.5 rounded-md border border-muted-foreground/15 px-1.5 py-1">
                    <div className="h-3.5 w-3.5 rounded-full bg-primary/40 shrink-0" />
                    <Bar w="2/3" h="xs" />
                  </div>
                ))}
              </div>
            );
          case "timeline":
            return (
              <div className="h-full flex flex-col gap-2 pl-3 relative">
                <div className="absolute left-1 top-1 bottom-1 w-px bg-muted-foreground/25" />
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-1.5 relative">
                    <div className="h-2.5 w-2.5 rounded-full bg-primary/50 -ml-3.5 z-10" />
                    <Bar w="1/2" h="xs" />
                  </div>
                ))}
              </div>
            );
          case "numbered-tiles":
            return (
              <div className="h-full grid grid-cols-2 gap-1.5">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="rounded-md border border-muted-foreground/15 p-1 flex items-end">
                    <span className="text-[10px] font-black text-primary/15 leading-none">0{i + 1}</span>
                  </div>
                ))}
              </div>
            );
          case "avatar-cards":
            return (
              <div className="h-full grid grid-cols-3 gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="rounded-md border border-muted-foreground/15 p-1.5 flex flex-col items-center gap-1">
                    <div className="h-4 w-4 rounded-full bg-primary/40" />
                    <Bar w="2/3" h="xs" />
                  </div>
                ))}
              </div>
            );
          case "team-list":
            return (
              <div className="h-full flex flex-col justify-center divide-y divide-muted-foreground/10">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-1.5 py-1">
                    <div className="h-3 w-3 rounded-full bg-primary/40 shrink-0" />
                    <Bar w="1/2" h="xs" />
                  </div>
                ))}
              </div>
            );
          case "accordion":
            return (
              <div className="h-full flex flex-col gap-1.5 justify-center">
                <div className="rounded border border-primary/30 bg-primary/5 px-1.5 py-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <Bar w="1/2" h="xs" tone="primary" />
                    <div className="h-1.5 w-1.5 rounded-full bg-primary/40" />
                  </div>
                  <Bar w="2/3" h="xs" />
                </div>
                {[0, 1].map((i) => (
                  <div key={i} className="rounded border border-muted-foreground/15 px-1.5 py-1 flex items-center justify-between">
                    <Bar w="1/2" h="xs" />
                    <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
                  </div>
                ))}
              </div>
            );
          case "faq-grid":
            return (
              <div className="h-full grid grid-cols-2 gap-1.5">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="space-y-1">
                    <Bar w="2/3" h="xs" tone="primary" />
                    <Bar w="full" h="xs" />
                  </div>
                ))}
              </div>
            );
          case "masonry":
            return (
              <div className="h-full grid grid-cols-3 gap-1">
                <Box className="row-span-2" />
                <Box />
                <Box className="row-span-2" />
                <Box />
              </div>
            );
          case "gallery-clean":
            return (
              <div className="h-full grid grid-cols-4 gap-0.5">
                {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <div key={i} className="bg-muted-foreground/15" />
                ))}
              </div>
            );
          case "colored-tiles":
            return (
              <div className="h-full grid grid-cols-3 gap-1.5">
                <div className="rounded-md bg-primary/50" />
                <div className="rounded-md bg-primary/35" />
                <div className="rounded-md bg-primary/25" />
              </div>
            );
          case "pill-list":
            return (
              <div className="h-full flex flex-wrap items-center gap-1 content-center">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-3.5 rounded-full border border-muted-foreground/20 px-2 flex items-center">
                    <Bar w="1/3" h="xs" />
                  </div>
                ))}
              </div>
            );
          case "stats-dark":
            return (
              <div className="h-full rounded-md bg-muted-foreground/20 flex items-center gap-1.5 px-2">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="h-2.5 w-6 rounded bg-primary/50" />
                    <Bar w="2/3" h="xs" />
                  </div>
                ))}
              </div>
            );
          case "cta-split":
            return (
              <div className="h-full rounded-md bg-primary/10 border border-primary/20 flex items-center justify-between px-2.5">
                <Bar w="1/2" h="sm" tone="primary" />
                <div className="h-2.5 w-8 rounded-full bg-primary/60 shrink-0" />
              </div>
            );
          case "pricing-dark":
            return (
              <div className="h-full grid grid-cols-3 gap-1.5 items-stretch">
                <Box className="bg-muted-foreground/20" />
                <Box className="border-primary/50 bg-primary/15" />
                <Box className="bg-muted-foreground/20" />
              </div>
            );
          default:
            return <Box className="h-full" />;
        }
      })()}
    </div>
  );
}
