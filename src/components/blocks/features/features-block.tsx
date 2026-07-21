import React from "react";
import type { FeaturesBlockProps } from "@/types/cms";
import { cn } from "@/lib/utils";
import * as LucideIcons from "lucide-react";
import { Check } from "lucide-react";
import Image from "next/image";

function DynIcon({ name, className }: { name?: string; className?: string }) {
  if (!name) return null;
  const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name];
  return Icon ? <Icon className={className} /> : null;
}

// ─── Variant: dark ─────────────────────────────────────────────────────────
// Full-bleed brand-gradient section, heading + body on the left, translucent
// checklist "highlight" cards on the right (each item's title used as a
// highlight line) — manufacturing/corporate/B2B "about" sections.
function FeaturesDark({ data }: { data: FeaturesBlockProps["data"] }) {
  const image = data.items.find((i) => i.imageUrl)?.imageUrl;
  return (
    <div className="w-full relative overflow-hidden bg-gradient-to-br from-primary to-secondary">
      {image && (
        <div className="absolute inset-0">
          <Image src={image} alt={data.title ?? ""} fill className="object-cover opacity-20" />
        </div>
      )}
      <div className="relative max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        <div>
          {data.subtitle && <p className="text-[11px] font-bold uppercase tracking-widest mb-3 text-primary-foreground/50">{data.subtitle}</p>}
          {data.title && <h2 className="text-2xl md:text-3xl font-extrabold text-primary-foreground mb-4 leading-tight">{data.title}</h2>}
          {data.description && <p className="text-sm text-primary-foreground/65 leading-relaxed">{data.description}</p>}
        </div>
        <div className="space-y-2.5">
          {data.items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 bg-primary-foreground/10 border border-primary-foreground/10 rounded-lg px-4 py-2.5">
              <Check className="w-3.5 h-3.5 text-primary-foreground/60 shrink-0" />
              <span className="text-primary-foreground/80 text-sm font-medium">{item.title}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Variant: icon-list-cards ──────────────────────────────────────────────
// Vertical stack of clean bordered cards — icon in a colored circle on the
// left, title + description on the right, generous spacing and a subtle
// hover lift. Good for professional/corporate "why choose us" sections.
function FeaturesIconListCards({ data }: { data: FeaturesBlockProps["data"] }) {
  return (
    <div className="max-w-3xl mx-auto">
      {(data.title || data.subtitle) && (
        <div className="text-center mb-12">
          {data.subtitle && <p className="text-xs font-bold uppercase tracking-widest mb-3 text-primary">{data.subtitle}</p>}
          {data.title && <h2 className="text-3xl font-bold mb-3">{data.title}</h2>}
          {data.description && <p className="text-muted-foreground leading-relaxed">{data.description}</p>}
        </div>
      )}
      <div className="space-y-5">
        {data.items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-5 border rounded-2xl p-6 bg-background transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              {item.imageUrl ? (
                <Image src={item.imageUrl} alt={item.title} width={40} height={40} className="rounded-full object-cover w-10 h-10" />
              ) : (
                <DynIcon name={item.icon} className="w-6 h-6 text-primary" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
              {item.description && (
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{item.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Variant: bento-grid ────────────────────────────────────────────────────
// Asymmetric bento-box grid — first item spans two columns as a large
// feature tile, the rest render as smaller single-col tiles. Modern SaaS
// landing-page feel. Falls back to a plain grid when there aren't enough
// items (<3) to make the asymmetry read as intentional.
function FeaturesBentoGrid({ data }: { data: FeaturesBlockProps["data"] }) {
  const { items } = data;
  const canBento = items.length >= 3;

  const Tile = ({ item, large }: { item: (typeof items)[number]; large?: boolean }) => (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/5 to-secondary/5 p-6 flex flex-col",
        large ? "sm:col-span-2 row-span-2 justify-end min-h-[220px]" : "min-h-[160px] justify-end",
      )}
    >
      {item.imageUrl && (
        <div className="absolute inset-0">
          <Image src={item.imageUrl} alt={item.title} fill className="object-cover opacity-15" />
        </div>
      )}
      <div className="relative">
        <div className={cn(
          "rounded-xl bg-primary/10 flex items-center justify-center mb-4",
          large ? "w-14 h-14" : "w-11 h-11",
        )}>
          <DynIcon name={item.icon} className={cn("text-primary", large ? "w-7 h-7" : "w-5 h-5")} />
        </div>
        <h3 className={cn("font-semibold mb-2", large ? "text-xl" : "text-base")}>{item.title}</h3>
        {item.description && (
          <p className={cn("text-muted-foreground leading-relaxed whitespace-pre-line", large ? "text-sm" : "text-xs")}>
            {item.description}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto">
      {(data.title || data.subtitle) && (
        <div className="mb-12 text-center">
          {data.subtitle && <p className="text-xs font-bold uppercase tracking-widest mb-3 text-primary">{data.subtitle}</p>}
          {data.title && <h2 className="text-3xl font-bold mb-3">{data.title}</h2>}
          {data.description && <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto">{data.description}</p>}
        </div>
      )}
      {canBento ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item, i) => (
            <Tile key={item.id} item={item} large={i === 0} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {items.map((item) => (
            <Tile key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

export function FeaturesBlock({ block }: { block: FeaturesBlockProps }) {
  if (block.templateVariant === "dark") return <FeaturesDark data={block.data} />;
  if (block.templateVariant === "icon-list-cards") return <FeaturesIconListCards data={block.data} />;
  if (block.templateVariant === "bento-grid") return <FeaturesBentoGrid data={block.data} />;
  const { data } = block;
  const { title, subtitle, layout, columns, items, style } = data;

  const colClass = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-2 lg:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-4",
  }[columns];

  if (layout === "alternating") {
    return (
      <div className="max-w-5xl mx-auto space-y-16">
        {(title || subtitle) && (
          <div className="text-center">
            {title && <h2 className="text-3xl font-bold mb-3">{title}</h2>}
            {subtitle && <p className="text-lg text-muted-foreground">{subtitle}</p>}
          </div>
        )}
        {items.map((item, i) => (
          <div key={item.id} className={cn("flex flex-col md:flex-row items-center gap-10", i % 2 !== 0 && "md:flex-row-reverse")}>
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.title} className="w-full md:w-1/2 rounded-xl object-cover aspect-video" />
            ) : (
              <div className="w-full md:w-1/2 rounded-xl bg-muted aspect-video flex items-center justify-center">
                <DynIcon name={item.icon} className="w-12 h-12 text-primary" />
              </div>
            )}
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (layout === "icon-list") {
    return (
      <div className="max-w-3xl mx-auto">
        {(title || subtitle) && (
          <div className="text-center mb-10">
            {title && <h2 className="text-3xl font-bold mb-3">{title}</h2>}
            {subtitle && <p className="text-lg text-muted-foreground">{subtitle}</p>}
          </div>
        )}
        <div className="space-y-4">
          {items.map(item => (
            <div key={item.id} className={cn(
              "flex items-start gap-4 p-4 rounded-xl",
              style === "card" && "border bg-white shadow-sm",
              style === "gradient" && "bg-gradient-to-r from-primary/10 to-transparent border border-primary/20",
            )}>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <DynIcon name={item.icon} className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {(title || subtitle) && (
        <div className={cn("mb-12", layout === "centered" ? "text-center" : "")}>
          {title && <h2 className="text-3xl font-bold mb-3">{title}</h2>}
          {subtitle && <p className="text-lg text-muted-foreground">{subtitle}</p>}
        </div>
      )}
      <div className={cn("grid grid-cols-1 gap-8", colClass)}>
        {items.map(item => (
          <div key={item.id} className={cn(
            "flex flex-col",
            layout === "centered" && "items-center text-center",
            style === "card" && "bg-white border rounded-xl p-6 shadow-sm",
            style === "gradient" && "bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl p-6 border border-primary/10",
          )}>
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
              style === "minimal" ? "bg-muted" : "bg-primary/10",
            )}>
              <DynIcon name={item.icon} className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
