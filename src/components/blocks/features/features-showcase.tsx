"use client";

import React from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import type { FeaturesBlockProps } from "@/types/cms";
import { cn } from "@/lib/utils";
import { ScHeading, WaIcon, scStyle, isExternal } from "@/components/blocks/_primitives/showcase";
import { useSiteContact, waLink } from "@/components/site/site-contact-context";

type D = FeaturesBlockProps["data"];
const num = (i: number) => String(i + 1).padStart(2, "0");
const ext = (url?: string) => (isExternal(url) ? { target: "_blank", rel: "noopener noreferrer" } : {});

/** Text + chips on the left, sticky quote card (photo, text, button) on the right. */
export function FeaturesOverviewQuote({ data }: { data: D }) {
  const contact = useSiteContact();
  const card = data.card ?? {};
  const href = card.whatsapp
    ? waLink(contact.whatsapp || contact.phone, card.whatsappText || `Hi, I would like a quote${data.eyebrow ? ` for ${data.eyebrow}` : ""}.`) ?? "#"
    : card.buttonUrl || "#";
  const hasCard = !!(card.title || card.text || card.imageUrl);
  return (
    <div className="sc-root max-w-7xl mx-auto grid gap-12 lg:grid-cols-[1.25fr_1fr] items-start" style={scStyle(data.colors)}>
      <div data-reveal>
        {data.eyebrow && <span className="sc-eyebrow mb-3">{data.eyebrow}</span>}
        {data.title && <h2 className="text-3xl sm:text-4xl font-extrabold leading-[1.12] tracking-tight text-foreground mb-4">{data.title}</h2>}
        {data.description && <p className="text-base sm:text-lg text-muted-foreground leading-relaxed whitespace-pre-line">{data.description}</p>}
        {!!data.tags?.length && (
          <ul className="flex flex-wrap gap-2.5 mt-7">
            {data.tags.map((t, i) => (
              <li key={i} className="flex items-center gap-2 rounded-[calc(var(--radius)-2px)] bg-primary/10 px-3.5 py-2 text-sm font-semibold text-foreground">
                <Check className="w-4 h-4 text-primary" />{t}
              </li>
            ))}
          </ul>
        )}
      </div>
      {hasCard && (
        <aside data-reveal className="lg:sticky lg:top-28 overflow-hidden rounded-[calc(var(--radius)+10px)] border bg-card shadow-xl">
          {card.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={card.imageUrl} alt={card.title ?? ""} className="w-full aspect-[16/10] object-cover" />
          )}
          <div className="p-6">
            {card.title && <strong className="block text-xl font-extrabold text-foreground" style={{ fontFamily: "var(--heading-font)" }}>{card.title}</strong>}
            {card.text && <p className="text-muted-foreground mt-2 mb-5 leading-relaxed">{card.text}</p>}
            {card.buttonLabel && (
              <a href={href} {...ext(href)} className="sc-btn sc-btn-grad">{card.whatsapp && <WaIcon />}{card.buttonLabel}</a>
            )}
          </div>
        </aside>
      )}
    </div>
  );
}

/** Numbered tiles (01, 02...) on a dark band, or a light bordered matrix. */
export function FeaturesNumberedGrid({ data }: { data: D }) {
  const dark = data.tone !== "light";
  const cols = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-2 lg:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4" }[data.columns] ?? "sm:grid-cols-2 lg:grid-cols-3";
  return (
    <div className={cn("sc-root px-6 py-16 sm:py-24", dark && "sc-on-dark sc-dark-bg")} style={scStyle(data.colors)}>
      <div className="max-w-7xl mx-auto">
        <ScHeading eyebrow={data.eyebrow} title={data.title} subtitle={data.subtitle || data.description} onDark={dark} />
        <div className={cn("grid", cols, dark ? "gap-4" : "border rounded-[calc(var(--radius)+10px)] overflow-hidden bg-card")}>
          {data.items.map((it, i) => (
            <div key={it.id} data-reveal className={cn(
              "p-6 sm:p-7 transition-all",
              dark
                ? "rounded-[calc(var(--radius)+6px)] border border-white/10 bg-white/[.03] hover:-translate-y-1"
                : "border-b border-r border-border",
            )} style={dark ? { borderColor: "color-mix(in srgb, var(--sc-accent-c) 20%, transparent)" } : undefined}>
              <span className={cn("font-extrabold text-sm", dark ? "sc-accent" : "text-primary")} style={{ fontFamily: "var(--heading-font)" }}>{num(i)}</span>
              <h3 className={cn("text-lg font-extrabold mt-2 mb-2", dark ? "text-white" : "text-foreground")}>{it.title}</h3>
              <p className={cn("leading-relaxed text-[15px]", dark ? "text-white/65" : "text-muted-foreground")}>{it.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Photo with a floating badge beside a heading, text, stat tiles and buttons. */
export function FeaturesImageStats({ data }: { data: D }) {
  return (
    <div className="sc-root max-w-7xl mx-auto grid gap-12 lg:gap-16 lg:grid-cols-[1fr_1.1fr] items-center" style={scStyle(data.colors)}>
      <div className="relative" data-reveal>
        {data.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.imageUrl} alt={data.title ?? ""} loading="lazy" className="w-full aspect-[4/4.3] object-cover rounded-[calc(var(--radius)+14px)] shadow-2xl" />
        )}
        {(data.badge?.title || data.badge?.text) && (
          <div className="sc-dark-bg absolute left-3 lg:-left-4 bottom-8 rounded-[calc(var(--radius)+6px)] px-5 py-4 text-white shadow-2xl border" style={{ borderColor: "color-mix(in srgb, var(--sc-accent-c) 35%, transparent)" }}>
            {data.badge.title && <strong className="block text-xl font-extrabold sc-accent" style={{ fontFamily: "var(--heading-font)" }}>{data.badge.title}</strong>}
            {data.badge.text && <span className="text-sm text-white/70">{data.badge.text}</span>}
          </div>
        )}
      </div>
      <div data-reveal>
        {data.eyebrow && <span className="sc-eyebrow mb-3">{data.eyebrow}</span>}
        {data.title && <h2 className="text-3xl sm:text-4xl font-extrabold leading-[1.1] tracking-tight text-foreground">{data.title}</h2>}
        {data.description && <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mt-4 whitespace-pre-line">{data.description}</p>}
        {!!data.items.length && (
          <div className="grid gap-4 sm:grid-cols-2 mt-8">
            {data.items.map((it) => (
              <div key={it.id} className="rounded-[calc(var(--radius)+6px)] border bg-card p-5">
                <strong className="block text-3xl font-extrabold leading-none sc-grad-text" style={{ fontFamily: "var(--heading-font)", background: "linear-gradient(90deg, hsl(var(--primary)), var(--sc-accent-c))", WebkitBackgroundClip: "text", backgroundClip: "text" }}>{it.title}</strong>
                {it.label && <b className="block text-foreground mt-2">{it.label}</b>}
                {it.description && <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{it.description}</p>}
              </div>
            ))}
          </div>
        )}
        {!!data.buttons?.length && (
          <div className="flex flex-wrap gap-3 mt-8">
            {data.buttons.map((b) => (
              <Link key={b.id} href={b.url || "#"} {...ext(b.url)} className={cn("sc-btn", b.style === "outline" ? "sc-btn-ghost" : "sc-btn-grad")}>{b.label}</Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
