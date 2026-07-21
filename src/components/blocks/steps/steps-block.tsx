import React from "react";
import type { StepsBlockProps } from "@/types/cms";
import { cn } from "@/lib/utils";
import * as LucideIcons from "lucide-react";

function DynIcon({ name, className }: { name?: string; className?: string }) {
  if (!name) return null;
  const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name];
  return Icon ? <Icon className={className} /> : null;
}

// ─── Variant: timeline-connected ─────────────────────────────────────────────
// Vertical timeline: a continuous line down the left with circular numbered
// nodes on it, title+description to the right — "how it works" processes.
function StepsTimelineConnected({ block }: { block: StepsBlockProps }) {
  const { data } = block;
  const { title, subtitle, items } = data;
  return (
    <div className="max-w-3xl mx-auto">
      {(title || subtitle) && (
        <div className="text-center mb-12">
          {title && <h2 className="text-3xl font-bold mb-3">{title}</h2>}
          {subtitle && <p className="text-lg text-muted-foreground">{subtitle}</p>}
        </div>
      )}
      <div className="relative">
        <div className="absolute left-5 top-5 bottom-5 w-px bg-border" />
        <div className="space-y-10">
          {items.map((item, i) => (
            <div key={item.id} className="relative flex items-start gap-6">
              <div className="relative z-10 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0 shadow-lg shadow-primary/20 ring-4 ring-background">
                {item.icon ? <DynIcon name={item.icon} className="w-4 h-4" /> : item.number ?? String(i + 1).padStart(2, "0")}
              </div>
              <div className="flex-1 pt-1.5">
                <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                {item.description && <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{item.description}</p>}
                {item.imageUrl && <img src={item.imageUrl} alt={item.title} className="mt-3 rounded-lg w-full max-w-xs object-cover" />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Variant: numbered-cards ──────────────────────────────────────────────────
// Horizontal row of bordered cards (wraps to grid on mobile), each with a huge
// faded oversized step number in the corner — distinct from the legacy
// "connected"/"card" style branches.
function StepsNumberedCards({ block }: { block: StepsBlockProps }) {
  const { data } = block;
  const { title, subtitle, items } = data;
  return (
    <div className="max-w-6xl mx-auto">
      {(title || subtitle) && (
        <div className="text-center mb-12">
          {title && <h2 className="text-3xl font-bold mb-3">{title}</h2>}
          {subtitle && <p className="text-lg text-muted-foreground">{subtitle}</p>}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {items.map((item, i) => (
          <div key={item.id} className="relative overflow-hidden rounded-2xl border bg-card p-6 pt-10">
            <span
              aria-hidden
              className="absolute -top-3 right-3 text-7xl font-black text-primary/10 select-none leading-none"
            >
              {item.number ?? String(i + 1).padStart(2, "0")}
            </span>
            <div className="relative z-10">
              {item.icon && (
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <DynIcon name={item.icon} className="w-5 h-5 text-primary" />
                </div>
              )}
              <h3 className="font-semibold text-lg mb-1.5">{item.title}</h3>
              {item.description && <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{item.description}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StepsBlock({ block }: { block: StepsBlockProps }) {
  if (block.templateVariant === "timeline-connected") return <StepsTimelineConnected block={block} />;
  if (block.templateVariant === "numbered-cards") return <StepsNumberedCards block={block} />;
  const { data } = block;
  const { title, subtitle, layout, items, style } = data;

  return (
    <div className="max-w-5xl mx-auto">
      {(title || subtitle) && (
        <div className="text-center mb-12">
          {title && <h2 className="text-3xl font-bold mb-3">{title}</h2>}
          {subtitle && <p className="text-lg text-muted-foreground">{subtitle}</p>}
        </div>
      )}

      {layout === "horizontal" ? (
        <div className="flex flex-col sm:flex-row items-start gap-0">
          {items.map((item, i) => (
            <div key={item.id} className="flex-1 flex flex-col items-center text-center relative">
              {style === "connected" && i < items.length - 1 && (
                <div className="hidden sm:block absolute top-5 left-1/2 w-full h-0.5 bg-primary/20" />
              )}
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mb-3 relative z-10",
                style === "plain" ? "bg-primary/10 text-primary border-2 border-primary" : "bg-primary text-primary-foreground",
              )}>
                {item.icon ? <DynIcon name={item.icon} className="w-4 h-4" /> : item.number ?? (i + 1)}
              </div>
              <h3 className="font-semibold mb-1">{item.title}</h3>
              {item.description && <p className="text-sm text-muted-foreground whitespace-pre-line">{item.description}</p>}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {items.map((item, i) => (
            <div key={item.id} className={cn(
              "flex items-start gap-5",
              style === "card" && "bg-white border rounded-xl p-5 shadow-sm",
            )}>
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                "bg-primary text-primary-foreground",
              )}>
                {item.icon ? <DynIcon name={item.icon} className="w-4 h-4" /> : item.number ?? (i + 1)}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                {item.description && <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{item.description}</p>}
                {item.imageUrl && <img src={item.imageUrl} alt={item.title} className="mt-3 rounded-lg w-full max-w-xs object-cover" />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
