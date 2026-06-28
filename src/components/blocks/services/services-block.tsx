import React from "react";
import type { ServicesBlockProps, ServiceItem } from "@/types/cms";
import Link from "next/link";
import Image from "next/image";
import * as LucideIcons from "lucide-react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Icon resolver ─────────────────────────────────────────────────────────

function ServiceIcon({ item, size = "md" }: { item: ServiceItem; size?: "sm" | "md" | "lg" }) {
  const sizeMap = { sm: "h-5 w-5", md: "h-7 w-7", lg: "h-10 w-10" };
  const cls = sizeMap[size];

  if (item.iconType === "image" && item.imageUrl) {
    return (
      <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0">
        <Image src={item.imageUrl} alt={item.title} fill className="object-cover" />
      </div>
    );
  }
  if (item.iconType === "emoji" && item.icon) {
    return <span className={cn("leading-none", size === "lg" ? "text-4xl" : size === "sm" ? "text-xl" : "text-3xl")}>{item.icon}</span>;
  }
  if (item.icon && item.iconType === "lucide") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Icon = (LucideIcons as any)[item.icon] as React.ComponentType<{ className?: string }>;
    if (Icon) return <Icon className={cls} />;
  }
  return <div className="w-8 h-8 rounded bg-primary/20" />;
}

// ─── Variant: icon-cards-grid ──────────────────────────────────────────────
// White cards, top border accent, icon + title + description + price + link
function ServicesIconCardsGrid({ data }: { data: ServicesBlockProps["data"] }) {
  const colMap = { 2: "md:grid-cols-2", 3: "md:grid-cols-3", 4: "md:grid-cols-2 lg:grid-cols-4" }[data.columns] ?? "md:grid-cols-3";
  return (
    <div className="max-w-7xl mx-auto">
      {(data.title || data.subtitle) && (
        <div className="text-center mb-12">
          {data.subtitle && <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-2">{data.subtitle}</p>}
          {data.title && <h2 className="text-3xl md:text-4xl font-bold">{data.title}</h2>}
        </div>
      )}
      <div className={cn("grid grid-cols-1 gap-6", colMap)}>
        {data.items.map((item) => (
          <div key={item.id} className="service-card bg-card border border-border rounded-xl p-6 flex flex-col hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border-t-4 border-t-primary">
            <div className="text-primary mb-4">
              <ServiceIcon item={item} size="md" />
            </div>
            <h3 className="font-bold text-lg mb-2">{item.title}</h3>
            <p className="text-muted-foreground text-sm flex-1 leading-relaxed whitespace-pre-line">{item.description}</p>
            {item.link && (
              <div className="mt-4 flex items-center justify-between">
                {item.linkLabel && (
                  <span className="text-xs font-semibold text-primary">{item.linkLabel}</span>
                )}
                <Link href={item.link} className="inline-flex items-center gap-1 text-sm text-primary hover:underline font-medium ml-auto">
                  Learn More <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Variant: image-cards-dark ────────────────────────────────────────────
// Dark cards with top image, gold title — luxury / spa aesthetic
function ServicesImageCardsDark({ data }: { data: ServicesBlockProps["data"] }) {
  const colMap = { 2: "md:grid-cols-2", 3: "md:grid-cols-3", 4: "md:grid-cols-2 lg:grid-cols-4" }[data.columns] ?? "md:grid-cols-3";
  return (
    <div className="max-w-7xl mx-auto">
      {(data.title || data.subtitle) && (
        <div className="text-center mb-12">
          {data.subtitle && <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-3">{data.subtitle}</p>}
          {data.title && <h2 className="text-3xl md:text-4xl font-light">{data.title}</h2>}
        </div>
      )}
      <div className={cn("grid grid-cols-1 gap-6", colMap)}>
        {data.items.map((item) => (
          <div key={item.id} className="service-card group bg-card border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-all duration-300">
            {item.imageUrl && (
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image src={item.imageUrl} alt={item.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
              </div>
            )}
            <div className="p-5">
              <h3 className="font-semibold text-base mb-1 text-primary">{item.title}</h3>
              <p className="text-muted-foreground text-xs leading-relaxed mb-3 whitespace-pre-line">{item.description}</p>
              {item.linkLabel && (
                <p className="text-xs font-medium text-foreground/60 tracking-wider">{item.linkLabel}</p>
              )}
              {item.link && (
                <Link href={item.link} className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2">
                  Book Now <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Variant: bordered-list ────────────────────────────────────────────────
// Left border accent, horizontal list layout — law firm / formal
function ServicesBorderedList({ data }: { data: ServicesBlockProps["data"] }) {
  return (
    <div className="max-w-5xl mx-auto">
      {(data.title || data.subtitle) && (
        <div className="mb-10">
          {data.subtitle && <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-2">{data.subtitle}</p>}
          {data.title && <h2 className="text-3xl md:text-4xl font-bold">{data.title}</h2>}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {data.items.map((item) => (
          <div key={item.id} className="service-card flex gap-4 p-5 border-l-4 border-l-secondary bg-card border border-border rounded-r-xl">
            <div className="text-primary shrink-0 mt-1">
              <ServiceIcon item={item} size="sm" />
            </div>
            <div>
              <h3 className="font-bold text-base mb-1">{item.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">{item.description}</p>
              {item.link && (
                <Link href={item.link} className="inline-flex items-center gap-1 text-xs text-primary mt-2 hover:underline font-medium">
                  {item.linkLabel ?? "Learn More"} <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Variant: dark-grid-cards ──────────────────────────────────────────────
// Dark bg cards with lucide icons, gradient icon bg — tech/agency
function ServicesDarkGridCards({ data }: { data: ServicesBlockProps["data"] }) {
  const colMap = { 2: "md:grid-cols-2", 3: "md:grid-cols-3", 4: "md:grid-cols-2 lg:grid-cols-3" }[data.columns] ?? "md:grid-cols-3";
  return (
    <div className="max-w-7xl mx-auto">
      {(data.title || data.subtitle) && (
        <div className="text-center mb-12">
          {data.subtitle && <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-2">{data.subtitle}</p>}
          {data.title && <h2 className="text-3xl md:text-4xl font-black tracking-tight">{data.title}</h2>}
        </div>
      )}
      <div className={cn("grid grid-cols-1 gap-5", colMap)}>
        {data.items.map((item) => (
          <div key={item.id} className="service-card group p-6 rounded-xl border border-border bg-card hover:border-primary/50 hover:-translate-y-1 transition-all duration-200">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-5">
              <ServiceIcon item={item} size="sm" />
            </div>
            <h3 className="font-bold text-base mb-2">{item.title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed mb-4 whitespace-pre-line">{item.description}</p>
            {item.link && (
              <Link href={item.link} className="inline-flex items-center gap-1 text-xs font-semibold text-primary group-hover:gap-2 transition-all">
                {item.linkLabel ?? "Learn More"} <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Variant: menu-cards ────────────────────────────────────────────────────
// Food menu style — image top, category label, price — restaurant
function ServicesMenuCards({ data }: { data: ServicesBlockProps["data"] }) {
  const colMap = { 2: "md:grid-cols-2", 3: "md:grid-cols-3", 4: "md:grid-cols-2 lg:grid-cols-4" }[data.columns] ?? "md:grid-cols-3";
  return (
    <div className="max-w-7xl mx-auto">
      {(data.title || data.subtitle) && (
        <div className="text-center mb-12">
          {data.subtitle && <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-2">{data.subtitle}</p>}
          {data.title && <h2 className="text-3xl md:text-4xl font-bold italic">{data.title}</h2>}
        </div>
      )}
      <div className={cn("grid grid-cols-1 gap-8", colMap)}>
        {data.items.map((item) => (
          <div key={item.id} className="service-card group">
            {item.imageUrl && (
              <div className="relative rounded-xl overflow-hidden aspect-[4/3] mb-4 shadow-md">
                <Image src={item.imageUrl} alt={item.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
            )}
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-semibold text-base">{item.title}</h3>
              {item.linkLabel && (
                <span className="text-sm font-bold text-primary shrink-0">{item.linkLabel}</span>
              )}
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">{item.description}</p>
            {item.link && (
              <Link href={item.link} className="inline-flex items-center gap-1 text-xs text-primary mt-3 hover:underline font-medium">
                Reserve <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Variant: program-cards-dark ──────────────────────────────────────────
// Dark cards with top image, orange accents, bold title — gym
function ServicesProgramCardsDark({ data }: { data: ServicesBlockProps["data"] }) {
  const colMap = { 2: "md:grid-cols-2", 3: "md:grid-cols-3", 4: "md:grid-cols-2 lg:grid-cols-3" }[data.columns] ?? "md:grid-cols-3";
  return (
    <div className="max-w-7xl mx-auto">
      {(data.title || data.subtitle) && (
        <div className="mb-10">
          {data.subtitle && <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-2">{data.subtitle}</p>}
          {data.title && <h2 className="text-3xl md:text-5xl font-black tracking-tight uppercase">{data.title}</h2>}
        </div>
      )}
      <div className={cn("grid grid-cols-1 gap-5", colMap)}>
        {data.items.map((item) => (
          <div key={item.id} className="service-card group relative overflow-hidden rounded-none border-t-4 border-t-primary bg-card border border-border">
            {item.imageUrl && (
              <div className="relative aspect-[16/9] overflow-hidden">
                <Image src={item.imageUrl} alt={item.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-card/90 to-transparent" />
              </div>
            )}
            <div className="p-5">
              <h3 className="font-black text-lg uppercase tracking-tight mb-1">{item.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-3 whitespace-pre-line">{item.description}</p>
              {item.linkLabel && (
                <p className="text-xs font-bold text-primary uppercase tracking-widest">{item.linkLabel}</p>
              )}
              {item.link && (
                <Link href={item.link} className="inline-flex items-center gap-1 text-xs font-semibold text-primary mt-2">
                  Join Program <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Legacy renderer (fallback) ───────────────────────────────────────────

function ServicesLegacy({ data }: { data: ServicesBlockProps["data"] }) {
  const { title, subtitle, layout, columns, items, cardStyle } = data;
  const colMap = { 2: "md:grid-cols-2", 3: "md:grid-cols-3", 4: "md:grid-cols-4" }[columns] ?? "md:grid-cols-3";
  const cardClass = {
    flat: "bg-transparent",
    elevated: "bg-white shadow-lg rounded-xl p-6",
    bordered: "border rounded-xl p-6",
    gradient: "bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-6",
  }[cardStyle] ?? "bg-white rounded-xl p-6 shadow";

  return (
    <div className="max-w-7xl mx-auto">
      {(title || subtitle) && (
        <div className="text-center mb-12">
          {subtitle && <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-2">{subtitle}</p>}
          {title && <h2 className="text-3xl md:text-4xl font-bold">{title}</h2>}
        </div>
      )}
      {layout === "list" ? (
        <div className="space-y-6">
          {items.map((item) => (
            <div key={item.id} className={cn("flex gap-4 items-start", cardClass)}>
              <div className="shrink-0 text-primary"><ServiceIcon item={item} /></div>
              <div>
                <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                <p className="text-muted-foreground text-sm whitespace-pre-line">{item.description}</p>
                {item.link && (
                  <Link href={item.link} className="inline-flex items-center gap-1 text-sm text-primary mt-2 hover:underline">
                    {item.linkLabel ?? "Learn More"} <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={cn("grid grid-cols-1 gap-6", colMap)}>
          {items.map((item) => (
            <div key={item.id} className={cn(cardClass, "flex flex-col")}>
              <div className="text-primary mb-4"><ServiceIcon item={item} /></div>
              <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
              <p className="text-muted-foreground text-sm flex-1 whitespace-pre-line">{item.description}</p>
              {item.link && (
                <Link href={item.link} className="inline-flex items-center gap-1 text-sm text-primary mt-4 hover:underline font-medium">
                  {item.linkLabel ?? "Learn More"} <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function ServicesBlock({ block }: { block: ServicesBlockProps }) {
  const variant = block.templateVariant;
  if (variant === "icon-cards-grid") return <ServicesIconCardsGrid data={block.data} />;
  if (variant === "image-cards-dark") return <ServicesImageCardsDark data={block.data} />;
  if (variant === "bordered-list") return <ServicesBorderedList data={block.data} />;
  if (variant === "dark-grid-cards") return <ServicesDarkGridCards data={block.data} />;
  if (variant === "menu-cards") return <ServicesMenuCards data={block.data} />;
  if (variant === "program-cards-dark") return <ServicesProgramCardsDark data={block.data} />;
  return <ServicesLegacy data={block.data} />;
}
