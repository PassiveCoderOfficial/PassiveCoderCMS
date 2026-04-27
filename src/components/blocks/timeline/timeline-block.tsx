import React from "react";
import type { TimelineBlockProps } from "@/types/cms";
import { cn } from "@/lib/utils";
import * as LucideIcons from "lucide-react";
import { Circle } from "lucide-react";

function DynIcon({ name, className }: { name?: string; className?: string }) {
  if (!name) return null;
  const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name];
  return Icon ? <Icon className={className} /> : <Circle className={className} />;
}

export function TimelineBlock({ block }: { block: TimelineBlockProps }) {
  const { data } = block;
  const { title, subtitle, layout, items, style } = data;

  return (
    <div className="max-w-4xl mx-auto">
      {(title || subtitle) && (
        <div className="text-center mb-12">
          {title && <h2 className="text-3xl font-bold mb-3">{title}</h2>}
          {subtitle && <p className="text-lg text-muted-foreground">{subtitle}</p>}
        </div>
      )}

      {layout === "horizontal" ? (
        <div className="flex items-start gap-0 overflow-x-auto pb-4">
          {items.map((item, i) => (
            <div key={item.id} className="flex flex-col items-center min-w-[160px] flex-1">
              <div className="flex items-center w-full">
                <div className={cn("h-0.5 flex-1", i === 0 ? "opacity-0" : "bg-primary/30")} />
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground shrink-0">
                  {item.icon ? <DynIcon name={item.icon} className="w-4 h-4" /> : <span className="text-xs font-bold">{i + 1}</span>}
                </div>
                <div className={cn("h-0.5 flex-1", i === items.length - 1 ? "opacity-0" : "bg-primary/30")} />
              </div>
              <div className="mt-3 text-center px-2">
                {item.date && <p className="text-xs text-muted-foreground mb-1">{item.date}</p>}
                <h3 className="text-sm font-semibold">{item.title}</h3>
                {item.description && <p className="text-xs text-muted-foreground mt-1">{item.description}</p>}
              </div>
            </div>
          ))}
        </div>
      ) : layout === "alternating" ? (
        <div className="relative">
          <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-0.5 bg-primary/20" />
          <div className="space-y-12">
            {items.map((item, i) => (
              <div key={item.id} className={cn("flex items-start gap-8 relative", i % 2 === 0 ? "flex-row" : "flex-row-reverse")}>
                <div className="flex-1">
                  <div className={cn(
                    "p-5 rounded-xl",
                    style === "card" ? "bg-white border shadow-sm" : style === "colored" ? "bg-primary/5 border border-primary/20" : "",
                    i % 2 === 0 ? "text-right" : "text-left",
                  )}>
                    {item.date && <p className="text-xs text-muted-foreground mb-1">{item.date}</p>}
                    <h3 className="font-semibold text-lg">{item.title}</h3>
                    {item.description && <p className="text-sm text-muted-foreground mt-1">{item.description}</p>}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground shrink-0 z-10 mt-3">
                  {item.icon ? <DynIcon name={item.icon} className="w-4 h-4" /> : <span className="text-xs font-bold">{i + 1}</span>}
                </div>
                <div className="flex-1" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="relative pl-8">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-primary/20" />
          <div className="space-y-8">
            {items.map((item, i) => (
              <div key={item.id} className="relative">
                <div className="absolute -left-8 top-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                  {item.icon ? <DynIcon name={item.icon} className="w-3.5 h-3.5" /> : <span className="text-xs font-bold">{i + 1}</span>}
                </div>
                <div className={cn(
                  "ml-4",
                  style === "card" ? "bg-white border rounded-xl p-5 shadow-sm" : style === "colored" ? "bg-primary/5 border border-primary/20 rounded-xl p-5" : "",
                )}>
                  {item.date && <p className="text-xs text-muted-foreground mb-1">{item.date}</p>}
                  <h3 className="font-semibold text-lg">{item.title}</h3>
                  {item.description && <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{item.description}</p>}
                  {item.imageUrl && <img src={item.imageUrl} alt={item.title} className="mt-3 rounded-lg w-full max-w-sm object-cover" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
