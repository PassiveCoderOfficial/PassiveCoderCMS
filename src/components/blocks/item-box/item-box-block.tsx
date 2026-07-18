import React from "react";
import type { ItemBoxBlockProps, ItemBoxItem } from "@/types/cms";
import Link from "next/link";
import Image from "next/image";
import * as LucideIcons from "lucide-react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Row shapes each content source resolves to, before normalizing to
// ItemBoxItem. Kept here (not per-source files) since every resolver
// (server + client) needs the exact same mapping logic.

export type ItemBoxRow = {
  id: string;
  title: string;
  description?: string | null;
  icon?: string | null;
  icon_type?: "lucide" | "image" | "emoji" | null;
  image_url?: string | null;
  link?: string | null;
  link_label?: string | null;
  slug?: string | null;
};

export function mapItemBoxRows(rows: ItemBoxRow[], sourceType: "page" | "post" | "service" | "feature" | "portfolio" | "testimonial" | null): ItemBoxItem[] {
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description ?? undefined,
    image: r.image_url
      ? { type: "url", value: r.image_url }
      : r.icon
        ? { type: "icon", value: r.icon }
        : { type: "none" },
    link: sourceType && (sourceType === "page" || sourceType === "post")
      ? { type: sourceType, refId: r.id, url: r.slug ? `/${r.slug}` : undefined }
      : r.link
        ? { type: "manual", url: r.link }
        : undefined,
  }));
}

function resolveLinkUrl(item: ItemBoxItem): string | undefined {
  if (!item.link) return undefined;
  if (item.link.type === "manual") return item.link.url;
  return item.link.url;
}

function ItemIcon({ item }: { item: ItemBoxItem }) {
  const image = item.image;
  if (!image || image.type === "none") return null;
  if (image.type === "url" && image.value) {
    return (
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg">
        <Image src={image.value} alt={item.title} fill className="object-cover" />
      </div>
    );
  }
  if (image.type === "icon" && image.value) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Icon = (LucideIcons as any)[image.value] as React.ComponentType<{ className?: string }>;
    if (Icon) return <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-2"><Icon className="h-6 w-6" /></div>;
  }
  return null;
}

const colMap: Record<2 | 3 | 4, string> = {
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-2 lg:grid-cols-4",
};

const cardClassMap: Record<ItemBoxBlockProps["data"]["cardStyle"], string> = {
  flat: "bg-transparent",
  elevated: "bg-card shadow-lg rounded-xl p-6",
  bordered: "border border-border rounded-xl p-6",
  gradient: "bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-6",
};

export function ItemBoxByData({ data }: { data: ItemBoxBlockProps["data"] }) {
  const { title, subtitle, layout, columns, items, cardStyle } = data;
  const cardClass = cardClassMap[cardStyle] ?? cardClassMap.elevated;

  return (
    <div className="max-w-7xl mx-auto">
      {(title || subtitle) && (
        <div className="text-center mb-12">
          {subtitle && <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-2">{subtitle}</p>}
          {title && <h2 className="text-3xl md:text-4xl font-bold">{title}</h2>}
        </div>
      )}
      {!items.length ? (
        <p className="text-center text-sm text-muted-foreground py-10">No items to show yet.</p>
      ) : layout === "list" ? (
        <div className="space-y-6">
          {items.map((item) => {
            const url = resolveLinkUrl(item);
            return (
              <div key={item.id} className={cn("flex gap-4 items-start", cardClass)}>
                <ItemIcon item={item} />
                <div>
                  <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                  {item.description && <p className="text-muted-foreground text-sm whitespace-pre-line">{item.description}</p>}
                  {url && (
                    <Link href={url} className="inline-flex items-center gap-1 text-sm text-primary mt-2 hover:underline">
                      Learn More <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className={cn("grid grid-cols-1 gap-6", colMap[columns] ?? colMap[3])}>
          {items.map((item) => {
            const url = resolveLinkUrl(item);
            return (
              <div key={item.id} className={cn(cardClass, "flex flex-col")}>
                <ItemIcon item={item} />
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                {item.description && <p className="text-muted-foreground text-sm flex-1 whitespace-pre-line">{item.description}</p>}
                {url && (
                  <Link href={url} className="inline-flex items-center gap-1 text-sm text-primary mt-4 hover:underline font-medium">
                    Learn More <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
