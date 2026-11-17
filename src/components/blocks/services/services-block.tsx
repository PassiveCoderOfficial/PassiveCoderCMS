import React from "react";
import { WIDE_COLS } from "./wide-cols";
import type { ServicesBlockProps, ServiceItem } from "@/types/cms";
import Link from "next/link";
import Image from "@/components/ui/smart-image";
import * as LucideIcons from "lucide-react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ServicesBento, ServicesPhotoCards } from "./services-showcase";
import { ServicesBoutiqueTiles } from "./services-boutique";
import { ServicesFilterTabs } from "./services-filter";
import { focusStyle } from "@/lib/image-focus";

// ─── Group resolution ──────────────────────────────────────────────────────
// When data.source === "group", items live in the service_groups/service_items
// tables (Dashboard > Services), not in data.items. Both callers below resolve
// the live items before handing off to the variant renderers, so the
// variant components themselves stay unaware of where items came from.

export type ServiceItemRow = {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  icon_type: ServiceItem["iconType"];
  image_url: string | null;
  link: string | null;
  link_label: string | null;
};

export function mapRows(rows: ServiceItemRow[]): ServiceItem[] {
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description ?? "",
    icon: r.icon ?? undefined,
    iconType: r.icon_type ?? "lucide",
    imageUrl: r.image_url ?? undefined,
    link: r.link ?? undefined,
    linkLabel: r.link_label ?? undefined,
  }));
}

// ─── Icon resolver ─────────────────────────────────────────────────────────

function ServiceIcon({ item, size = "md" }: { item: ServiceItem; size?: "sm" | "md" | "lg" }) {
  const sizeMap = { sm: "h-5 w-5", md: "h-7 w-7", lg: "h-10 w-10" };
  const cls = sizeMap[size];

  if (item.iconType === "image" && item.imageUrl) {
    return (
      <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0">
        <Image src={item.imageUrl} style={focusStyle(item.imageFocus)} alt={item.title} fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover" />
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

/** Item link as a solid brand button (data.linkStyle "solid"); the whole card stays clickable. */
function SolidItemLink({ item, className, color, noArrow }: { item: ServiceItem; className?: string; color?: string; noArrow?: boolean }) {
  if (!item.link) return null;
  return (
    <Link href={item.link} className={cn("after:absolute after:inset-0 after:content-[''] inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity", className)}
      style={color ? { background: color, color: "#fff" } : undefined}>
      {item.linkLabel || "Learn More"} {!noArrow && <ArrowRight className="h-3.5 w-3.5" />}
    </Link>
  );
}

/** wa.me link for a card's WhatsApp button; {title} in the message becomes the card title. */
function cardWaHref(wa: NonNullable<ServicesBlockProps["data"]["whatsappButton"]>, item: ServiceItem) {
  const num = (wa.number ?? "").replace(/[^0-9]/g, "");
  const msg = (wa.message || "Hello, I would like a quotation for {title}.").replace(/\{title\}/g, item.title);
  return `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
}

/** Card heading: centred (default) or "split" — eyebrow pill + title left, intro text right. */
function SplitHeading({ data }: { data: ServicesBlockProps["data"] }) {
  const points = (data.headingPoints ?? []).filter((p) => p.text);
  return (
    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
      <div>
        {data.eyebrow && (
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.14em] text-primary">
            <i className="h-[7px] w-[7px] rounded-full bg-accent" />{data.eyebrow}
          </span>
        )}
        {data.title && <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-primary mt-4 max-w-xl">{data.title}</h2>}
        {points.length > 0 && (data.intro || data.subtitle) && <p className="text-muted-foreground max-w-xl leading-7 whitespace-pre-line mt-4">{data.intro || data.subtitle}</p>}
      </div>
      {points.length > 0 ? (
        <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-4 rounded-2xl border bg-card px-6 py-5 lg:max-w-xl w-full lg:w-auto">
          {points.map((p) => (
            <li key={p.id} className="flex items-center gap-3 text-sm font-semibold text-foreground">
              <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border border-primary/30 text-primary"><LucideIcons.Check className="h-3.5 w-3.5" strokeWidth={3} /></span>
              {p.text}
            </li>
          ))}
        </ul>
      ) : (data.intro || data.subtitle) && <p className="text-muted-foreground max-w-xl leading-7 whitespace-pre-line">{data.intro || data.subtitle}</p>}
    </div>
  );
}

// ─── Variant: icon-cards-grid ──────────────────────────────────────────────
// White cards, top border accent, icon + title + description + price + link
/** Detail rows (Client, Type, Year…) shown under an item's description. */
export function ItemMeta({ item, light }: { item: ServiceItem; light?: boolean }) {
  const rows = (item.meta ?? []).filter((m) => m.label?.trim() && m.value?.trim());
  if (!rows.length) return null;
  return (
    <dl className={cn("mt-2 mb-3 grid gap-1 text-xs", light ? "text-white/70" : "text-muted-foreground")}>
      {rows.map((m) => (
        <div key={m.label} className="flex gap-1.5"><dt className="font-semibold">{m.label}:</dt><dd className="break-words">{m.value}</dd></div>
      ))}
    </dl>
  );
}

function ServicesIconCardsGrid({ data }: { data: ServicesBlockProps["data"] }) {
  const colMap = ({ ...{ 2: "md:grid-cols-2", 3: "md:grid-cols-3", 4: "md:grid-cols-2 lg:grid-cols-4" }, ...WIDE_COLS } as Record<number, string>)[data.columns] ?? "md:grid-cols-3";
  return (
    <div className="max-w-7xl mx-auto">
      {(data.title || data.subtitle || data.intro) && (
        <div className="text-center mb-12">
          {data.subtitle && <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-2">{data.subtitle}</p>}
          {data.title && <h2 className="text-3xl md:text-4xl font-bold">{data.title}</h2>}
          {data.intro && <p className="mt-3 opacity-80 leading-relaxed max-w-2xl [.text-center>&]:mx-auto whitespace-pre-line">{data.intro}</p>}
        </div>
      )}
      <div className={cn("grid grid-cols-1 gap-6", colMap)}>
        {data.items.map((item) => (
          <div key={item.id} className="service-card relative bg-card border border-border rounded-xl p-6 flex flex-col items-center text-center hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border-t-4 border-t-primary">
            <div className="text-primary mb-4 flex items-center justify-center">
              <ServiceIcon item={item} size="lg" />
            </div>
            <h3 className="font-bold text-lg mb-2">{item.title}</h3>
            <p className="text-muted-foreground text-sm flex-1 leading-relaxed whitespace-pre-line">{item.description}</p>
            <ItemMeta item={item} />
            {item.link && (
              <div className="mt-4">
                {data.linkStyle === "solid" ? <SolidItemLink item={item} /> : (
                <Link href={item.link} className="after:absolute after:inset-0 after:content-[''] inline-flex items-center gap-1 text-sm text-primary hover:underline font-semibold">
                  {item.linkLabel || "Learn More"} <ArrowRight className="h-3 w-3" />
                </Link>
                )}
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
  const colMap = ({ ...{ 2: "md:grid-cols-2", 3: "md:grid-cols-3", 4: "md:grid-cols-2 lg:grid-cols-4" }, ...WIDE_COLS } as Record<number, string>)[data.columns] ?? "md:grid-cols-3";
  return (
    <div className="max-w-7xl mx-auto">
      {(data.title || data.subtitle || data.intro) && (
        <div className="text-center mb-12">
          {data.subtitle && <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-3">{data.subtitle}</p>}
          {data.title && <h2 className="text-3xl md:text-4xl font-light">{data.title}</h2>}
          {data.intro && <p className="mt-3 opacity-80 leading-relaxed max-w-2xl [.text-center>&]:mx-auto whitespace-pre-line">{data.intro}</p>}
        </div>
      )}
      <div className={cn("grid grid-cols-1 gap-6", colMap)}>
        {data.items.map((item) => (
          <div key={item.id} className={cn("service-card relative group bg-card border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-all duration-300", data.captionTone === "dark" && "flex flex-col")}>
            {item.imageUrl && (
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image src={item.imageUrl} style={focusStyle(item.imageFocus)} alt={item.title} fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                {!data.noImageFade && <div className="absolute inset-0 theme-image-fade" />}
              </div>
            )}
            <div className={cn("p-5", data.captionTone === "dark" && "flex-1 bg-neutral-900 text-white", data.itemAlign === "center" && "text-center")}>
              <h3 className="font-semibold text-base mb-1 text-primary">{item.title}</h3>
              <p className={cn("text-xs leading-relaxed mb-3 whitespace-pre-line", data.captionTone === "dark" ? "text-white/75" : "text-muted-foreground")}>{item.description}</p>
            <ItemMeta item={item} light={data.captionTone === "dark"} />

              {item.link && (data.linkStyle === "solid" ? <SolidItemLink item={item} className="mt-2" /> : (
                <Link href={item.link} className="after:absolute after:inset-0 after:content-[''] inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2">
                  {item.linkLabel ?? "Learn More"} <ArrowRight className="h-3 w-3" />
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Variant: site-showcase ───────────────────────────────────────────────
// Live websites as browser windows: screenshot pinned to the top (where the
// hero is), category chip, domain, whole card clickable.
function ServicesSiteShowcase({ data }: { data: ServicesBlockProps["data"] }) {
  const colMap = ({ ...{ 2: "md:grid-cols-2", 3: "md:grid-cols-2 lg:grid-cols-3", 4: "md:grid-cols-2 lg:grid-cols-4" }, ...WIDE_COLS } as Record<number, string>)[data.columns] ?? "md:grid-cols-2 lg:grid-cols-3";
  return (
    <div className="max-w-7xl mx-auto">
      {(data.eyebrow || data.title || data.subtitle) && (
        <div className="text-center mb-12 max-w-2xl mx-auto">
          {data.eyebrow && <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-3">{data.eyebrow}</p>}
          {data.title && <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">{data.title}</h2>}
          {data.intro && <p className="mt-3 opacity-80 leading-relaxed max-w-2xl [.text-center>&]:mx-auto whitespace-pre-line">{data.intro}</p>}
          {data.subtitle && <p className="mt-4 text-lg text-muted-foreground">{data.subtitle}</p>}
        </div>
      )}
      <div className={cn("grid grid-cols-1 gap-6", colMap)}>
        {data.items.map((item) => (
          <div key={item.id} className="service-card relative group rounded-2xl border border-border bg-card overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_24px_60px_-24px_hsl(var(--primary)/0.45)]">
            <div className="flex items-center gap-1.5 px-3 h-8 border-b border-border bg-muted/60">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
              {item.description && (
                <span className="ml-2 flex-1 truncate rounded-md bg-background/70 px-2 py-0.5 text-[11px] text-muted-foreground">{item.description}</span>
              )}
            </div>
            {item.imageUrl && (
              <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                <Image src={item.imageUrl} style={focusStyle(item.imageFocus)} alt={item.title} fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover object-top transition-transform duration-[1200ms] group-hover:scale-[1.04]" />
              </div>
            )}
            <div className="flex items-center justify-between gap-3 p-5">
              <div className="min-w-0">
                <h3 className="font-semibold text-base truncate">{item.title}</h3>
                {item.kicker && <span className="mt-1.5 inline-block rounded-full border border-border px-2.5 py-0.5 text-[11px] text-muted-foreground">{item.kicker}</span>}
              </div>
              {item.link && (
                <Link href={item.link} target={item.link.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="after:absolute after:inset-0 after:content-[''] shrink-0 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  {item.linkLabel ?? "Visit"} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
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
      {(data.title || data.subtitle || data.intro) && (
        <div className="mb-10">
          {data.subtitle && <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-2">{data.subtitle}</p>}
          {data.title && <h2 className="text-3xl md:text-4xl font-bold">{data.title}</h2>}
          {data.intro && <p className="mt-3 opacity-80 leading-relaxed max-w-2xl [.text-center>&]:mx-auto whitespace-pre-line">{data.intro}</p>}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {data.items.map((item) => (
          <div key={item.id} className="service-card relative flex gap-4 p-5 border-l-4 border-l-secondary bg-card border border-border rounded-r-xl">
            <div className="text-primary shrink-0 mt-1">
              <ServiceIcon item={item} size="sm" />
            </div>
            <div>
              <h3 className="font-bold text-base mb-1">{item.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">{item.description}</p>
            <ItemMeta item={item} />
              {item.link && (
                <Link href={item.link} className="after:absolute after:inset-0 after:content-[''] inline-flex items-center gap-1 text-xs text-primary mt-2 hover:underline font-medium">
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
  const colMap = ({ ...{ 2: "md:grid-cols-2", 3: "md:grid-cols-3", 4: "md:grid-cols-2 lg:grid-cols-3" }, ...WIDE_COLS } as Record<number, string>)[data.columns] ?? "md:grid-cols-3";
  return (
    <div className="max-w-7xl mx-auto">
      {(data.title || data.subtitle || data.intro) && (
        <div className="text-center mb-12">
          {data.subtitle && <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-2">{data.subtitle}</p>}
          {data.title && <h2 className="text-3xl md:text-4xl font-black tracking-tight">{data.title}</h2>}
          {data.intro && <p className="mt-3 opacity-80 leading-relaxed max-w-2xl [.text-center>&]:mx-auto whitespace-pre-line">{data.intro}</p>}
        </div>
      )}
      <div className={cn("grid grid-cols-1 gap-5", colMap)}>
        {data.items.map((item) => (
          <div key={item.id} className="service-card relative group p-6 rounded-xl border border-border bg-card hover:border-primary/50 hover:-translate-y-1 transition-all duration-200">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-5">
              <ServiceIcon item={item} size="sm" />
            </div>
            <h3 className="font-bold text-base mb-2">{item.title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed mb-4 whitespace-pre-line">{item.description}</p>
            <ItemMeta item={item} />
            {item.link && (
              <Link href={item.link} className="after:absolute after:inset-0 after:content-[''] inline-flex items-center gap-1 text-xs font-semibold text-primary group-hover:gap-2 transition-all">
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
  const colMap = ({ ...{ 2: "md:grid-cols-2", 3: "md:grid-cols-3", 4: "md:grid-cols-2 lg:grid-cols-4" }, ...WIDE_COLS } as Record<number, string>)[data.columns] ?? "md:grid-cols-3";
  return (
    <div className="max-w-7xl mx-auto">
      {(data.title || data.subtitle || data.intro) && (
        <div className="text-center mb-12">
          {data.subtitle && <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-2">{data.subtitle}</p>}
          {data.title && <h2 className="text-3xl md:text-4xl font-bold italic">{data.title}</h2>}
          {data.intro && <p className="mt-3 opacity-80 leading-relaxed max-w-2xl [.text-center>&]:mx-auto whitespace-pre-line">{data.intro}</p>}
        </div>
      )}
      <div className={cn("grid grid-cols-1 gap-8", colMap)}>
        {data.items.map((item) => (
          <div key={item.id} className="service-card relative group">
            {item.imageUrl && (
              <div className="relative rounded-xl overflow-hidden aspect-[4/3] mb-4 shadow-md">
                <Image src={item.imageUrl} style={focusStyle(item.imageFocus)} alt={item.title} fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
            )}
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-semibold text-base">{item.title}</h3>

            </div>
            <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">{item.description}</p>
            <ItemMeta item={item} />
            {item.link && (
              <Link href={item.link} className="after:absolute after:inset-0 after:content-[''] inline-flex items-center gap-1 text-xs text-primary mt-3 hover:underline font-medium">
                {item.linkLabel ?? "Learn More"} <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Variant: image-tiles ─────────────────────────────────────────────────
// Framed photo tiles, title with a small arrow chip underneath. The whole
// tile links when an item has a link. Editorial / real estate.
function ServicesImageTiles({ data }: { data: ServicesBlockProps["data"] }) {
  const colMap = ({ ...{ 2: "md:grid-cols-2", 3: "sm:grid-cols-2 lg:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4" }, ...WIDE_COLS } as Record<number, string>)[data.columns] ?? "sm:grid-cols-2 lg:grid-cols-3";
  return (
    <div className="max-w-7xl mx-auto">
      {(data.title || data.subtitle || data.intro) && (
        <div className="mb-12">
          {data.subtitle && (
            <div className="border-t border-foreground/15 pt-6 flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-[3px] bg-foreground" />
              <span className="text-xs font-semibold uppercase tracking-[0.12em]">{data.subtitle}</span>
            </div>
          )}
          {data.title && <h2 className="mt-10 text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.02] max-w-3xl">{data.title}</h2>}
          {data.intro && <p className="mt-3 opacity-80 leading-relaxed max-w-2xl [.text-center>&]:mx-auto whitespace-pre-line">{data.intro}</p>}
        </div>
      )}
      <div className={cn("grid grid-cols-1 gap-x-6 gap-y-8", colMap)}>
        {data.items.map((item) => (
          <div key={item.id} className="service-card relative group">
            <div className="rounded-[20px] bg-card p-1.5 shadow-sm">
              <div className="relative rounded-[15px] overflow-hidden aspect-[3/2] bg-muted">
                {item.imageUrl && <Image src={item.imageUrl} style={focusStyle(item.imageFocus)} alt={item.title} fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover group-hover:scale-[1.04] transition-transform duration-700" />}
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 px-1">
              <h3 className="text-xl tracking-[-0.02em]">{item.title}</h3>
              {item.link ? (
                <Link href={item.link} aria-label={item.title} className="after:absolute after:inset-0 after:content-[''] w-9 h-9 shrink-0 rounded-xl bg-card shadow-sm flex items-center justify-center group-hover:bg-foreground group-hover:text-background transition-colors">
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : null}
            </div>
            {item.description && <p className="mt-1.5 px-1 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{item.description}</p>}
            <div className="px-1"><ItemMeta item={item} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Variant: program-cards-dark ──────────────────────────────────────────
// Dark cards with top image, orange accents, bold title — gym
function ServicesProgramCardsDark({ data }: { data: ServicesBlockProps["data"] }) {
  const colMap = ({ ...{ 2: "md:grid-cols-2", 3: "md:grid-cols-3", 4: "md:grid-cols-2 lg:grid-cols-4" }, ...WIDE_COLS } as Record<number, string>)[data.columns] ?? "md:grid-cols-3";
  return (
    <div className="max-w-7xl mx-auto">
      {(data.title || data.subtitle || data.intro) && (
        <div className="mb-10">
          {data.subtitle && <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-2">{data.subtitle}</p>}
          {data.title && <h2 className="text-3xl md:text-5xl font-black tracking-tight uppercase">{data.title}</h2>}
          {data.intro && <p className="mt-3 opacity-80 leading-relaxed max-w-2xl [.text-center>&]:mx-auto whitespace-pre-line">{data.intro}</p>}
        </div>
      )}
      <div className={cn("grid grid-cols-1 gap-5", colMap)}>
        {data.items.map((item) => (
          <div key={item.id} className="service-card group relative overflow-hidden rounded-none border-t-4 border-t-primary bg-card border border-border">
            {item.imageUrl && (
              <div className="relative aspect-[16/9] overflow-hidden">
                <Image src={item.imageUrl} style={focusStyle(item.imageFocus)} alt={item.title} fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 theme-image-fade" />
              </div>
            )}
            <div className="p-5">
              <h3 className="font-black text-lg uppercase tracking-tight mb-1">{item.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-3 whitespace-pre-line">{item.description}</p>
            <ItemMeta item={item} />

              {item.link && (
                <Link href={item.link} className="after:absolute after:inset-0 after:content-[''] inline-flex items-center gap-1 text-xs font-semibold text-primary mt-2">
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

// ─── Variant: numbered ──────────────────────────────────────────────────────
// Full-bleed brand-color section, glassy translucent cards, large ghost number
// badge — manufacturing/corporate/B2B.
function ServicesNumbered({ data }: { data: ServicesBlockProps["data"] }) {
  const colMap = ({ ...{ 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4" }, ...WIDE_COLS } as Record<number, string>)[data.columns] ?? "sm:grid-cols-3";
  return (
    <div className="w-full bg-primary">
      <div className="max-w-6xl mx-auto px-4 py-4">
        {(data.title || data.subtitle || data.intro) && (
          <div className="text-center mb-10">
            {data.subtitle && <p className="text-[11px] font-bold uppercase tracking-widest mb-2 text-primary-foreground/60">{data.subtitle}</p>}
            {data.title && <h2 className="text-2xl md:text-3xl font-extrabold text-primary-foreground">{data.title}</h2>}
            {data.intro && <p className="mt-3 opacity-80 leading-relaxed max-w-2xl [.text-center>&]:mx-auto whitespace-pre-line">{data.intro}</p>}
          </div>
        )}
        <div className={cn("grid grid-cols-2 gap-4", colMap)}>
          {data.items.map((item, i) => (
            <div key={item.id} className="service-card relative group rounded-xl overflow-hidden bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/15 hover:bg-primary-foreground/20 transition-all">
              {item.imageUrl ? (
                <div className="relative h-28 w-full">
                  <Image src={item.imageUrl} style={focusStyle(item.imageFocus)} alt={item.title} fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/10" />
                  <div className="absolute top-2 left-3 text-2xl font-black text-primary-foreground/30">{String(i + 1).padStart(2, "0")}</div>
                </div>
              ) : (
                <div className="p-5 pb-0">
                  <div className="text-3xl font-black text-primary-foreground/20 mb-3">{String(i + 1).padStart(2, "0")}</div>
                  <div className="text-primary-foreground"><ServiceIcon item={item} size="md" /></div>
                </div>
              )}
              <div className="p-4 pt-3">
                <h3 className="font-bold text-sm text-primary-foreground mb-1">{item.title}</h3>
                <p className="text-xs text-primary-foreground/60 leading-relaxed line-clamp-2 whitespace-pre-line">{item.description}</p>
            <ItemMeta item={item} light />
                {item.linkLabel && <p className="mt-2 text-xs font-bold text-primary-foreground/80">{item.linkLabel}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Legacy renderer (fallback) ───────────────────────────────────────────

function ServicesLegacy({ data }: { data: ServicesBlockProps["data"] }) {
  const { title, subtitle, layout, columns, items, cardStyle, intro } = data;
  const center = data.itemAlign === "center";
  const colMap = ({ ...{ 2: "md:grid-cols-2", 3: "md:grid-cols-3", 4: "md:grid-cols-4" }, ...WIDE_COLS } as Record<number, string>)[columns] ?? "md:grid-cols-3";
  const cardClass = {
    flat: "bg-transparent",
    elevated: "bg-card shadow-lg rounded-xl p-6",
    bordered: "border rounded-xl p-6",
    gradient: "bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-6",
  }[cardStyle] ?? "bg-card rounded-xl p-6 shadow";

  const wa = data.whatsappButton?.number ? data.whatsappButton : undefined;
  return (
    <div className="max-w-7xl mx-auto">
      {data.headingLayout === "split" && (title || subtitle || intro) && <SplitHeading data={data} />}
      {data.headingLayout !== "split" && (title || subtitle || intro) && (
        <div className="text-center mb-12">
          {subtitle && <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-2">{subtitle}</p>}
          {title && <h2 className="text-3xl md:text-4xl font-bold">{title}</h2>}
          {intro && <p className="mt-3 opacity-80 leading-relaxed max-w-2xl mx-auto whitespace-pre-line">{intro}</p>}
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
            <ItemMeta item={item} />
                {item.link && (
                  <Link href={item.link} className="after:absolute after:inset-0 after:content-[''] inline-flex items-center gap-1 text-sm text-primary mt-2 hover:underline">
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
            <div key={item.id} className={cn(cardClass, "relative flex flex-col", item.imageUrl && "overflow-hidden p-0 group", item.link && "cursor-pointer transition-shadow hover:shadow-xl")}>
              {/* A photo, when supplied, carries a service far better than a
                  generic glyph — fall back to the icon only when there is
                  none, so icon-only tenants are unaffected. */}
              {item.imageUrl ? (
                <div className={cn("relative overflow-hidden", !data.imageHeight && "aspect-[4/3]")} style={data.imageHeight ? { height: data.imageHeight } : undefined}>
                  <Image src={item.imageUrl} style={focusStyle(item.imageFocus)} alt={item.title} fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
              ) : (
                <div className={cn("text-primary mb-4", center && "self-center")}><ServiceIcon item={item} /></div>
              )}
              <div className={cn("flex flex-col flex-1", item.imageUrl && "p-6", center && "items-center text-center")}>
              {item.kicker && <span className="text-[11px] font-black uppercase tracking-[.14em] text-accent mb-1.5">{item.kicker}</span>}
              <h3 className={cn("text-lg mb-2", item.kicker ? "font-black text-primary text-xl" : "font-semibold")}>{item.title}</h3>
              <p className="text-muted-foreground text-sm flex-1 whitespace-pre-line">{item.description}</p>
            <ItemMeta item={item} />
              {wa && (
                <div className="mt-5 grid grid-cols-2 gap-2">
                  {item.link ? <SolidItemLink item={item} color={data.linkColor} noArrow className="px-3 text-xs font-black uppercase" /> : <span />}
                  <a href={cardWaHref(wa, item)} target="_blank" rel="noopener noreferrer"
                    className="relative z-[1] inline-flex items-center justify-center rounded-lg px-3 py-2.5 text-xs font-black uppercase text-white hover:opacity-90 transition-opacity"
                    style={{ background: wa.color || "#16a34a" }}>
                    {wa.label || "WhatsApp"}
                  </a>
                </div>
              )}
              {!wa && item.link && (data.linkStyle === "solid" ? <SolidItemLink item={item} color={data.linkColor} className="mt-4 self-start [.items-center>&]:self-center" /> : (
                // after:inset-0 stretches this link over the whole card so the
                // entire card is clickable without nesting anchors.
                <Link href={item.link} className="inline-flex items-center gap-1 text-sm text-primary mt-4 hover:underline font-medium after:absolute after:inset-0 after:content-['']">
                  {item.linkLabel ?? "Learn More"} <ArrowRight className="h-3 w-3" />
                </Link>
              ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ServicesByVariant({ data, variant }: { data: ServicesBlockProps["data"]; variant?: string }) {
  const cats = data.showFilter ? [...new Set(data.items.map((i) => i.category?.trim()).filter(Boolean) as string[])] : [];
  const body = cats.length > 1 ? <ServicesFilterTabs data={data} variant={variant} cats={cats} /> : <ServicesBody data={data} variant={variant} />;
  if (variant === "photo-cards" || !data.allLink?.url) return body;
  return (
    <>
      {body}
      <div className="mt-10 text-center">
        <Link href={data.allLink.url} className="inline-flex items-center gap-2 rounded-full border border-primary px-6 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground">
          {data.allLink.label || "View all"} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </>
  );
}

export function ServicesBody({ data, variant }: { data: ServicesBlockProps["data"]; variant?: string }) {
  if (variant === "icon-cards-grid") return <ServicesIconCardsGrid data={data} />;
  if (variant === "image-tiles") return <ServicesImageTiles data={data} />;
  if (variant === "image-cards-dark") return <ServicesImageCardsDark data={data} />;
  if (variant === "site-showcase") return <ServicesSiteShowcase data={data} />;
  if (variant === "bordered-list") return <ServicesBorderedList data={data} />;
  if (variant === "dark-grid-cards") return <ServicesDarkGridCards data={data} />;
  if (variant === "menu-cards") return <ServicesMenuCards data={data} />;
  if (variant === "program-cards-dark") return <ServicesProgramCardsDark data={data} />;
  if (variant === "numbered") return <ServicesNumbered data={data} />;
  if (variant === "bento") return <ServicesBento data={data} />;
  if (variant === "photo-cards") return <ServicesPhotoCards data={data} />;
  if (variant === "boutique-tiles") return <ServicesBoutiqueTiles data={data} />;
  return <ServicesLegacy data={data} />;
}
