"use client";

import React from "react";
import { IconBadge } from "@/components/blocks/_primitives/icon-badge";
import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";
import * as LucideIcons from "lucide-react";
import type { FeaturesBlockProps } from "@/types/cms";
import { cn } from "@/lib/utils";
import { ScHeading, WaIcon, scStyle, isExternal } from "@/components/blocks/_primitives/showcase";
import { useSiteContact, waLink } from "@/components/site/site-contact-context";
import { focusStyle } from "@/lib/image-focus";

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
        {data.title && (
          <div className="flex items-center gap-4 mb-4">
            {data.icon && <IconBadge name={data.icon} size="md" />}
            <h2 className="text-3xl sm:text-4xl font-extrabold leading-[1.12] tracking-tight text-foreground m-0">{data.title}</h2>
          </div>
        )}
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
            <img src={card.imageUrl} style={focusStyle(card.imageFocus)} alt={card.title ?? ""} className="w-full aspect-[16/10] object-cover" />
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
              {data.showIcons && it.icon
                ? <LIcon name={it.icon} className={cn("w-6 h-6", dark ? "sc-accent" : "text-primary")} />
                : <span className={cn("font-extrabold text-sm", dark ? "sc-accent" : "text-primary")} style={{ fontFamily: "var(--heading-font)" }}>{num(i)}</span>}
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
      <div className={cn("relative", data.badgePosition === "bottom-edge" && "mb-10")} data-reveal>
        {data.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.imageUrl} style={focusStyle(data.imageFocus)} alt={data.title ?? ""} loading="lazy" className={cn("w-full aspect-[4/4.3] object-cover rounded-[calc(var(--radius)+14px)] shadow-2xl")} />
        )}
        {(data.badge?.title || data.badge?.text) && (
          <div className={cn("sc-dark-bg absolute left-3 lg:-left-4 rounded-[calc(var(--radius)+6px)] px-5 py-4 text-white shadow-2xl border", data.badgePosition === "bottom-edge" ? "bottom-0 translate-y-1/2" : "bottom-8")} style={{ borderColor: "color-mix(in srgb, var(--sc-accent-c) 35%, transparent)" }}>
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

/** Title with one phrase drawn in a highlight colour (first match, case-sensitive). */
function Highlighted({ text, words, color }: { text: string; words?: string; color?: string }) {
  const i = words ? text.indexOf(words) : -1;
  if (!words || i < 0) return <>{text}</>;
  return <>{text.slice(0, i)}<span style={{ color: color || "hsl(var(--primary))" }}>{words}</span>{text.slice(i + words.length)}</>;
}

/** Bare lucide icon by name (no badge). */
function LIcon({ name, className }: { name?: string; className?: string }) {
  const Icon = name ? (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>>)[name] : undefined;
  return Icon ? <Icon className={className} strokeWidth={2.2} /> : null;
}

/** Small rounded label with a dot (eyebrow pill). */
function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.14em] text-primary">
      <i className="h-[7px] w-[7px] rounded-full" style={{ background: "var(--sc-accent-c)" }} />{children}
    </span>
  );
}

/** Text, buttons and a tag line on the left; a 2x2 grid of icon tiles on the right. */
export function FeaturesTextTiles({ data }: { data: D }) {
  const bordered = data.tileStyle === "bordered";
  const paras = (data.description ?? "").split(/\n\s*\n/).filter(Boolean);
  return (
    <div className="sc-root max-w-7xl mx-auto grid gap-10 lg:gap-12 lg:grid-cols-2 items-center" style={scStyle(data.colors)}>
      <div data-reveal>
        {data.eyebrow && <Pill>{data.eyebrow}</Pill>}
        {data.title && <h2 className="text-3xl sm:text-4xl font-black leading-tight tracking-tight text-primary mt-5" style={data.titleColor ? { color: data.titleColor } : undefined}><Highlighted text={data.title} words={data.titleHighlight} color={data.highlightColor} /></h2>}
        {paras.map((t, i) => <p key={i} className={cn("text-muted-foreground leading-7 whitespace-pre-line", i ? "mt-4" : "mt-5")}>{t}</p>)}
        {!!data.buttons?.length && (
          <div className="flex flex-wrap gap-3 mt-7">
            {data.buttons.map((b) => (
              <Link key={b.id} href={b.url || "#"} {...ext(b.url)}
                className={cn("inline-flex items-center gap-2.5 px-6 py-3 font-black transition-opacity hover:opacity-90",
                  b.style === "accent" ? "rounded-full text-slate-950" : b.style === "outline" ? "rounded-xl border-2 border-primary text-primary" : "rounded-xl bg-primary text-primary-foreground uppercase")}
                style={b.style === "accent" ? { background: "var(--sc-accent-c)" } : undefined}>
                {b.label}{b.style === "accent" && <ArrowRight className="w-4 h-4" />}
              </Link>
            ))}
          </div>
        )}
        {(!!data.tags?.length || data.footnote) && (
          <div className="mt-7 pt-5 border-t border-dashed border-slate-300 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            {(data.tags ?? []).map((t, i) => <b key={i} className="font-black text-primary">{t}</b>)}
            {data.footnote && <span>{data.footnote}</span>}
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4" data-reveal>
        {data.items.map((it) => (
          <div key={it.id} className={cn("rounded-2xl p-5 sm:p-6", bordered ? "bg-card border shadow-sm" : "bg-muted")}>
            {it.icon && (bordered
              ? <span className="inline-grid place-items-center w-11 h-11 rounded-xl bg-primary/10 text-primary"><LIcon name={it.icon} className="w-5 h-5" /></span>
              : <span className="sc-accent"><LIcon name={it.icon} className="w-6 h-6" /></span>)}
            <h3 className={cn("font-black mt-4", bordered ? "text-foreground" : "text-primary")}>{it.title}</h3>
            {it.description && <p className="text-sm text-muted-foreground mt-2 leading-6">{it.description}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Two-column cards with the icon on an arrow-shaped colour panel at the left. */
export function FeaturesArrowCards({ data }: { data: D }) {
  return (
    <div className="sc-root max-w-7xl mx-auto" style={scStyle(data.colors)}>
      {(data.eyebrow || data.title) && (
        <div className="mb-8 sm:mb-10" data-reveal>
          {data.eyebrow && (
            <div className="flex items-center gap-3 text-xs sm:text-sm font-extrabold uppercase tracking-[.16em] text-muted-foreground">
              <span className="inline-block w-7 h-[2px] bg-slate-400" />{data.eyebrow}
            </div>
          )}
          {data.title && <h2 className="text-2xl sm:text-3xl font-black text-foreground mt-4">{data.title}</h2>}
        </div>
      )}
      <div className={cn("grid gap-4 sm:gap-5", data.columns === 3 ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2")}>
        {data.items.map((it) => (
          <article key={it.id} data-reveal className="flex min-h-[132px] overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="w-[88px] sm:w-[102px] shrink-0 grid place-items-center text-white" style={{ background: "var(--sc-dark-c)", clipPath: "polygon(0 0,76% 0,100% 50%,76% 100%,0 100%)" }}>
              {it.icon && <LIcon name={it.icon} className="w-6 h-6" />}
            </div>
            <div className="p-4 sm:p-5 self-center">
              <h3 className="font-extrabold text-foreground">{it.title}</h3>
              {it.description && <p className="text-sm text-muted-foreground leading-6 mt-1">{it.description}</p>}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
