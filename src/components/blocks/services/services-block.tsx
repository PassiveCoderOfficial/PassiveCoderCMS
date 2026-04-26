import React from "react";
import type { ServicesBlockProps, ServiceItem } from "@/types/cms";
import Link from "next/link";
import Image from "next/image";
import * as LucideIcons from "lucide-react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

function ServiceIcon({ item }: { item: ServiceItem }) {
  if (item.iconType === "image" && item.imageUrl) {
    return (
      <div className="relative w-12 h-12 rounded-lg overflow-hidden">
        <Image src={item.imageUrl} alt={item.title} fill className="object-cover" />
      </div>
    );
  }
  if (item.iconType === "emoji" && item.icon) {
    return <span className="text-3xl">{item.icon}</span>;
  }
  if (item.icon && item.iconType === "lucide") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Icon = (LucideIcons as any)[item.icon] as React.ComponentType<{ className?: string }>;
    if (Icon) return <Icon className="h-7 w-7" />;
  }
  return <div className="w-8 h-8 rounded bg-primary/20" />;
}

export function ServicesBlock({ block }: { block: ServicesBlockProps }) {
  const { data } = block;
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
                <p className="text-muted-foreground text-sm">{item.description}</p>
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
              <p className="text-muted-foreground text-sm flex-1">{item.description}</p>
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
