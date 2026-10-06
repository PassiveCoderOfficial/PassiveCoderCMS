"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { HeroBlockProps } from "@/types/cms";
import { cn } from "@/lib/utils";
import { InlineText } from "../inline-text";
import { ScMeter, scStyle, isExternal } from "@/components/blocks/_primitives/showcase";

type D = HeroBlockProps["data"];

function Buttons({ data }: { data: D }) {
  const b = [data.primaryButton, data.secondaryButton];
  if (!b[0]?.label && !b[1]?.label) return null;
  return (
    <div className="flex flex-wrap gap-3">
      {b.map((x, i) => x?.label ? (
        <Link key={i} href={x.url || "#"} {...(isExternal(x.url) ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className={cn("sc-btn", i === 0 && x.variant !== "outline" ? "sc-btn-grad" : "sc-btn-ghost-dark")}
          style={x.bgColor ? { background: x.bgColor, color: x.textColor } : undefined}>
          {x.label}
        </Link>
      ) : null)}
    </div>
  );
}

/** Background photo + left-heavy dark scrim in the block's dark colour. */
function Bg({ data, opacity }: { data: D; opacity: number }) {
  return (
    <>
      {data.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={data.imageUrl} alt={data.imageAlt ?? ""} className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity, objectPosition: data.imagePosition ?? "center" }} />
      )}
      <div className="absolute inset-0 z-[1]" style={{ background: "linear-gradient(100deg, var(--sc-dark-c) 0%, color-mix(in srgb, var(--sc-dark-c) 88%, transparent) 40%, color-mix(in srgb, var(--sc-dark-c) 35%, transparent) 72%, color-mix(in srgb, var(--sc-dark-c) 60%, transparent) 100%)" }} />
    </>
  );
}

function Title({ block, size }: { block: HeroBlockProps; size: string }) {
  const { data } = block;
  return (
    <h1 className={cn("font-extrabold leading-[0.98] tracking-tight text-white", size)}>
      <InlineText blockId={block.id} field="title" value={data.title} />
      {data.titleAccent && (
        <>
          <br />
          <span className="sc-grad-text"><InlineText blockId={block.id} field="titleAccent" value={data.titleAccent} /></span>
        </>
      )}
    </h1>
  );
}

/** Dark photo hero with a glass spec card and an optional link strip. */
export function HeroSpecCard({ block }: { block: HeroBlockProps }) {
  const { data } = block;
  const card = data.specCard;
  const hasCard = !!(card && (card.title || card.meters?.length || card.stats?.length));
  const strip = data.strip ?? [];
  return (
    <section className="sc-root sc-on-dark sc-dark-bg relative overflow-hidden" style={scStyle(data.colors)}>
      <Bg data={data} opacity={1 - (data.overlayOpacity ?? 0.45)} />
      <div className="relative z-[2] max-w-7xl mx-auto px-6 pt-20 lg:pt-28 pb-14 lg:pb-24 grid gap-10 lg:gap-14 lg:grid-cols-[1.25fr_.85fr] items-center">
        <div className="flex flex-col gap-6 items-start">
          {data.badge && (
            <span className="inline-flex items-center gap-2.5 rounded-full border px-4 py-2 text-sm font-semibold text-white/85"
              style={{ borderColor: "color-mix(in srgb, var(--sc-accent-c) 40%, transparent)", background: "color-mix(in srgb, var(--sc-accent-c) 10%, transparent)" }}>
              <i className="w-2 h-2 rounded-full" style={{ background: "var(--sc-accent-c)", boxShadow: "0 0 12px var(--sc-accent-c)" }} />
              <InlineText blockId={block.id} field="badge" value={data.badge} />
            </span>
          )}
          <Title block={block} size="text-5xl sm:text-6xl lg:text-[5.4rem]" />
          {data.description && (
            <p className="text-lg text-white/75 leading-relaxed max-w-xl">
              <InlineText blockId={block.id} field="description" value={data.description} />
            </p>
          )}
          <Buttons data={data} />
        </div>
        {hasCard && (
          <div className="sc-glass rounded-[calc(var(--radius)+14px)] p-6 sm:p-7 text-white shadow-2xl">
            {card!.label && <span className="block text-[11px] font-bold uppercase tracking-[.18em] sc-accent">{card!.label}</span>}
            {card!.title && <b className="block text-2xl font-extrabold mt-1.5 mb-5" style={{ fontFamily: "var(--heading-font)" }}>{card!.title}</b>}
            <div className="grid gap-4">{(card!.meters ?? []).map((m) => <ScMeter key={m.id} label={m.label} value={m.value} onDark />)}</div>
            {!!card!.stats?.length && (
              <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-white/10">
                {card!.stats.map((s) => (
                  <div key={s.id}>
                    <strong className="block text-xl font-extrabold" style={{ fontFamily: "var(--heading-font)" }}>{s.value}</strong>
                    <span className="text-xs text-white/55">{s.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      {strip.length > 0 && (
        <div className="relative z-[2] border-t border-white/10 bg-black/30 backdrop-blur">
          <div className={cn("max-w-7xl mx-auto px-6 grid grid-cols-2", strip.length >= 3 && "md:grid-cols-3", strip.length >= 4 && "lg:grid-cols-4", strip.length >= 5 && "lg:grid-cols-5")}>
            {strip.map((it) => (
              <Link key={it.id} href={it.url || "#"} className="px-4 py-5 border-l border-t lg:border-t-0 border-white/10 hover:bg-white/5 transition-colors">
                <b className="block text-white text-[1.05rem] font-extrabold" style={{ fontFamily: "var(--heading-font)" }}>{it.title}</b>
                {it.subtitle && <span className="text-[13px] text-white/55">{it.subtitle}</span>}
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

const pretty = (seg: string) => decodeURIComponent(seg).replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/** Breadcrumb from the current address; the last crumb uses the banner title. */
function Breadcrumb({ current }: { current: string }) {
  const path = usePathname() ?? "/";
  const sep = <i className="not-italic mx-1.5 opacity-60">/</i>;
  if (path.startsWith("/dashboard")) {
    return <nav className="text-sm text-white/55 mb-5">Home {sep} <span className="text-white font-semibold">{current}</span></nav>;
  }
  const segs = path.split("/").filter(Boolean);
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-white/55 mb-5">
      <Link href="/" className="hover:text-white">Home</Link>
      {segs.map((s, i) => {
        const href = "/" + segs.slice(0, i + 1).join("/");
        const last = i === segs.length - 1;
        return (
          <React.Fragment key={href}>
            {sep}
            {last
              ? <span className="text-white font-semibold">{current || pretty(s)}</span>
              : <Link href={href} className="hover:text-white">{pretty(s)}</Link>}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

/** Inner-page banner: dark photo, breadcrumb, small label, title, text, buttons. */
export function HeroPageBanner({ block }: { block: HeroBlockProps }) {
  const { data } = block;
  return (
    <section className="sc-root sc-on-dark sc-dark-bg relative overflow-hidden" style={scStyle(data.colors)}>
      <Bg data={data} opacity={1 - (data.overlayOpacity ?? 0.2)} />
      <div className="relative z-[2] max-w-7xl mx-auto px-6 py-20 lg:py-28">
        {data.showBreadcrumb !== false && <Breadcrumb current={data.title} />}
        {data.badge && <span className="sc-eyebrow mb-3"><InlineText blockId={block.id} field="badge" value={data.badge} /></span>}
        <Title block={block} size="text-4xl sm:text-5xl lg:text-[4.2rem] max-w-3xl" />
        {data.description && (
          <p className="text-lg text-white/75 leading-relaxed max-w-2xl mt-4 mb-8">
            <InlineText blockId={block.id} field="description" value={data.description} />
          </p>
        )}
        <Buttons data={data} />
      </div>
    </section>
  );
}
