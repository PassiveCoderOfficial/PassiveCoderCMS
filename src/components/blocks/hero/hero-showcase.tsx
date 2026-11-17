"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { HeroBlockProps } from "@/types/cms";
import { focusToCss } from "@/lib/image-focus";
import { cn } from "@/lib/utils";
import { InlineText } from "../inline-text";
import { InlineLabel } from "../inline-label";
import { orderElements } from "@/components/blocks/_primitives/ordered-elements";
import { HeroTrust } from "./hero-trust";
import { ScMeter, scStyle, isExternal } from "@/components/blocks/_primitives/showcase";
import { IconBadge } from "@/components/blocks/_primitives/icon-badge";
import * as LucideIcons from "lucide-react";
import { focusStyle } from "@/lib/image-focus";

type D = HeroBlockProps["data"];

function Buttons({ data, blockId }: { data: D; blockId?: string }) {
  return <><Ctas data={data} blockId={blockId} /><HeroTrust data={data} onDark blockId={blockId} /></>;
}

const BTN_FIELDS = ["primaryButton", "secondaryButton", "tertiaryButton"] as const;

function Ctas({ data, blockId }: { data: D; blockId?: string }) {
  const b = [data.primaryButton, data.secondaryButton, data.tertiaryButton];
  if (!b.some((x) => x?.label)) return null;
  return (
    <div className="flex flex-wrap gap-3">
      {b.map((x, i) => x?.label ? (
        <Link key={i} href={x.url || "#"} {...(isExternal(x.url) ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className={cn("sc-btn", i === 0 && x.variant !== "outline" ? "sc-btn-grad" : "sc-btn-ghost-dark")}
          style={x.bgColor ? { background: x.bgColor, color: x.textColor } : undefined}>
          <InlineLabel blockId={blockId} field={`${BTN_FIELDS[i]}.label`} value={x.label} />
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
        <img src={data.imageUrl} alt={data.imageAlt ?? ""} className={`absolute inset-0 w-full h-full object-cover${data.mobileImageUrl ? " max-md:hidden" : ""}`}
          style={{ opacity, objectPosition: data.imagePosition ?? "center" }} />
      )}
      {data.mobileImageUrl && (
        // Phone photo (under 768px) when set.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={data.mobileImageUrl} alt={data.imageAlt ?? ""} className="absolute inset-0 w-full h-full object-cover md:hidden"
          style={{ opacity, objectPosition: focusToCss(data.mobileImageFocus) ?? "center" }} />
      )}
      <div className="absolute inset-0 z-[1]" style={{ background: "linear-gradient(100deg, var(--sc-dark-c) 0%, color-mix(in srgb, var(--sc-dark-c) 88%, transparent) 40%, color-mix(in srgb, var(--sc-dark-c) 35%, transparent) 72%, color-mix(in srgb, var(--sc-dark-c) 60%, transparent) 100%)" }} />
    </>
  );
}

function Title({ block, size }: { block: HeroBlockProps; size: string }) {
  const { data } = block;
  // accentInline: the accent words follow the title on the same line in the
  // solid accent colour (instead of a gradient second line).
  return (
    <h1 className={cn("font-extrabold leading-[0.98] tracking-tight text-white", size)}>
      <InlineText blockId={block.id} field="title" value={data.title} />
      {data.titleAccent && (
        data.accentInline ? (
          <>{" "}<span className="sc-accent"><InlineText blockId={block.id} field="titleAccent" value={data.titleAccent} /></span></>
        ) : (
          <>
            <br />
            <span className="sc-grad-text"><InlineText blockId={block.id} field="titleAccent" value={data.titleAccent} /></span>
          </>
        )
      )}
    </h1>
  );
}

/** Spec Card title sizes; "6xl"/unset keeps the original very large headline. */
const SC_TITLE: Record<string, string> = {
  "4xl": "text-[2.25rem] sm:text-5xl lg:text-[3.1rem]",
  "5xl": "text-[2.4rem] sm:text-5xl lg:text-[3.65rem]",
};

/** Row of small glass stat boxes under the buttons (e.g. 24/7 · Enquiries). */
function StatRow({ data }: { data: D }) {
  const stats = (data.statRow ?? []).filter((s) => s.value || s.label);
  if (!stats.length) return null;
  return (
    <div className={cn("grid grid-cols-2 gap-3 w-full max-w-2xl mt-1", stats.length >= 4 ? "sm:grid-cols-4" : stats.length === 3 && "sm:grid-cols-3")}>
      {stats.map((s) => (
        <div key={s.id} className="rounded-xl border border-white/15 bg-white/[.09] backdrop-blur-md px-4 py-3">
          <b className="block text-sm text-white">{s.value}</b>
          <span className="text-[11px] text-white/60">{s.label}</span>
        </div>
      ))}
    </div>
  );
}

/** Small pill chips under the stat boxes (icon + short text, e.g. "Licensed & Insured"). */
function ChipRow({ data }: { data: D }) {
  const chips = (data.chipRow ?? []).filter((c) => c.text);
  if (!chips.length) return null;
  const size = { sm: "text-[13px] px-3.5 py-2", md: "text-[15px] px-4 py-2.5", lg: "text-[17px] px-5 py-3" }[data.chipSize ?? "sm"];
  const iconSize = { sm: "w-3.5 h-3.5", md: "w-4 h-4", lg: "w-5 h-5" }[data.chipSize ?? "sm"];
  const border = data.chipBorder !== false;
  return (
    <div className={cn("flex flex-wrap mt-1", border ? "gap-2.5" : "gap-x-6 gap-y-2")}>
      {chips.map((c) => {
        const Icon = c.icon ? (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[c.icon] : null;
        return (
          <span key={c.id} className={cn("inline-flex items-center gap-2 font-semibold text-white/90", border ? cn("rounded-full border border-white/15 bg-white/[.06]", size) : size.split(" ")[0])}>
            {Icon ? <Icon className={cn(iconSize, "sc-accent")} /> : <i className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--sc-accent-c)" }} />}
            {c.text}
          </span>
        );
      })}
    </div>
  );
}

const BADGE_POS: Record<string, string> = {
  "top-right": "right-0 top-8",
  "top-left": "left-0 top-8",
  "bottom-right": "right-0 bottom-8",
  "bottom-left": "left-0 bottom-5",
};

/** Compact badges sit inside the photo's corners so the photo stays visible. */
const BADGE_POS_SM: Record<string, string> = {
  "top-right": "right-5 top-5",
  "top-left": "left-5 top-5",
  "bottom-right": "right-5 bottom-5",
  "bottom-left": "left-5 bottom-5",
};

/** Framed photo beside the text with small white cards floating on its edges. */
function SidePhoto({ data }: { data: D }) {
  const p = data.sidePhoto!;
  const full = p.imageFit === "full";
  const small = p.badgeSize === "sm";
  return (
    <div className={cn("relative lg:pl-5 mt-2 lg:mt-0", full && "my-12 lg:my-0")}>
      <div className="block rounded-[28px] p-3 overflow-hidden border border-white/15 bg-white/[.08] shadow-[0_30px_80px_rgba(0,0,0,.35)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.imageUrl} style={focusStyle(p.imageFocus)} alt={p.alt ?? ""} className={cn("w-full rounded-[22px]", full ? "h-auto" : "h-[390px] sm:h-[500px] object-cover")} />
      </div>
      {(p.badges ?? []).map((b) => {
        const inner = (
          <>
            <div className={cn("font-black leading-tight", small ? "text-xs sm:text-sm" : (b.title?.length ?? 0) > 10 ? "text-lg" : "text-2xl")}>{b.title}</div>
            {b.stars && <div className={cn("sc-accent tracking-widest", small ? "text-[10px]" : "text-sm")}>★★★★★</div>}
            {b.text && <div className={cn("font-bold text-slate-500", small ? "text-[9px]" : "text-[10px]")}>{b.text}</div>}
          </>
        );
        const cls = small
          ? cn("absolute z-[3] bg-white/95 rounded-lg px-2.5 py-1.5 shadow-md", BADGE_POS_SM[b.position ?? "top-right"])
          : cn("absolute z-[3] bg-white rounded-[18px] px-5 py-4 shadow-[0_15px_35px_rgba(0,0,0,.2)]", BADGE_POS[b.position ?? "top-right"], b.position === "bottom-left" && "hidden sm:block", full && ((b.position ?? "top-right").startsWith("top") ? "!top-0 -translate-y-1/2" : "!bottom-0 translate-y-1/2"));
        const style = { color: "var(--sc-dark-c)" };
        return b.link
          ? <Link key={b.id} href={b.link} className={cls} style={style}>{inner}</Link>
          : <div key={b.id} className={cls} style={style}>{inner}</div>;
      })}
    </div>
  );
}

/** Dark photo hero with a glass spec card and an optional link strip. */
export function HeroSpecCard({ block }: { block: HeroBlockProps }) {
  const { data } = block;
  const card = data.specCard;
  const side = !!data.sidePhoto?.imageUrl;
  const hasCard = !side && !!(card && (card.title || card.meters?.length || card.stats?.length));
  const strip = data.strip ?? [];
  return (
    <section className="sc-root sc-on-dark sc-dark-bg relative overflow-hidden" style={scStyle(data.colors)}>
      <Bg data={data} opacity={1 - (data.overlayOpacity ?? 0.45)} />
      {data.gridTexture && (
        <div aria-hidden className="absolute inset-0 z-[1] pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px)", backgroundSize: "38px 38px" }} />
      )}
      <div className={cn("relative z-[2] max-w-7xl mx-auto px-6 grid gap-10 lg:gap-14 items-center",
        side ? cn("py-16 sm:py-20 lg:py-24", data.sidePhoto?.imageFit === "full" ? "lg:grid-cols-[.85fr_1.15fr]" : "lg:grid-cols-[1.05fr_.95fr]") : "pt-20 lg:pt-28 pb-14 lg:pb-24 lg:grid-cols-[1.25fr_.85fr]")}>
        <div className="flex flex-col gap-6 items-start">
          {data.topLine && (
            <span className="inline-flex items-center gap-2.5 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm sm:text-base font-extrabold text-white">
              <i className="relative flex h-2.5 w-2.5"><i className="absolute inset-0 rounded-full animate-ping opacity-60" style={{ background: "var(--sc-accent-c)" }} /><i className="relative h-2.5 w-2.5 rounded-full" style={{ background: "var(--sc-accent-c)" }} /></i>
              <InlineText blockId={block.id} field="topLine" value={data.topLine} />
            </span>
          )}
          {/* Badge, headline, text and buttons follow the Style tab's Elements order / hide (same pieces as the classic designs). */}
          {orderElements(block.elements, {
            badge: <>
            {data.badge && data.badgeStyle === "text" && (
              <span className="text-[11px] font-black uppercase tracking-[.22em] sc-accent">
                <InlineText blockId={block.id} field="badge" value={data.badge} />
              </span>
            )}
            {data.badge && data.badgeStyle !== "text" && (
              <span className="inline-flex items-center gap-2.5 rounded-full border px-4 py-2 text-sm font-semibold text-white/85"
                style={{ borderColor: "color-mix(in srgb, var(--sc-accent-c) 40%, transparent)", background: "color-mix(in srgb, var(--sc-accent-c) 10%, transparent)" }}>
                <i className="w-2 h-2 rounded-full" style={{ background: "var(--sc-accent-c)", boxShadow: "0 0 12px var(--sc-accent-c)" }} />
                <InlineText blockId={block.id} field="badge" value={data.badge} />
              </span>
            )}
            </>,
            title: <Title block={block} size={SC_TITLE[data.typography?.titleSize ?? ""] ?? "text-5xl sm:text-6xl lg:text-[5.4rem]"} />,
            description: <>
            {data.description && (
              <p className={cn("text-lg text-white/75 leading-relaxed", side ? "max-w-2xl" : "max-w-xl")}>
                <InlineText blockId={block.id} field="description" value={data.description} />
              </p>
            )}
            </>,
            buttons: <>{data.trustFirst ? <><HeroTrust data={data} onDark blockId={block.id} /><Ctas data={data} blockId={block.id} /></> : <Buttons data={data} blockId={block.id} />}</>,
          })}
          <StatRow data={data} />
          <ChipRow data={data} />
        </div>
        {side && <SidePhoto data={data} />}
        {hasCard && (
          <div className="sc-glass rounded-[calc(var(--radius)+14px)] p-6 sm:p-7 text-white shadow-2xl">
            {card!.label && <span className="block text-[11px] font-bold uppercase tracking-[.18em] sc-accent"><InlineLabel blockId={block.id} field="specCard.label" value={card!.label} /></span>}
            {card!.title && <b className="block text-2xl font-extrabold mt-1.5 mb-5" style={{ fontFamily: "var(--heading-font)" }}><InlineLabel blockId={block.id} field="specCard.title" value={card!.title} /></b>}
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

// "Home" in the languages sites are translated into most often. English is
// listed for Arabic-first (or other non-English-main) sites with /en pages.
const HOME_LABEL: Record<string, string> = {
  en: "Home", ar: "الرئيسية", bn: "হোম", hi: "होम", ur: "ہوم", fr: "Accueil", es: "Inicio", de: "Startseite", it: "Home", pt: "Início",
  ru: "Главная", tr: "Ana Sayfa", fa: "خانه", zh: "首页", ja: "ホーム", ko: "홈", ms: "Utama", id: "Beranda", nl: "Home",
};

const pretty = (seg: string) => decodeURIComponent(seg).replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/** Breadcrumb from the current address; the last crumb uses the banner title.
 *  homeLabel (block field) replaces the first crumb; empty keeps "Home" in the
 *  page's language. */
function Breadcrumb({ current, homeLabel }: { current: string; homeLabel?: string }) {
  const path = usePathname() ?? "/";
  const sep = <i className="not-italic mx-1.5 opacity-60">/</i>;
  if (path.startsWith("/dashboard")) {
    return <nav className="text-sm text-white/55 mb-5">{`${homeLabel || "Home"} `}{sep} <span className="text-white font-semibold">{current}</span></nav>;
  }
  let segs = path.split("/").filter(Boolean);
  // Translated pages (/ar/...): Home goes to that language's home, and the
  // middle crumbs (English slugs) are dropped so nothing shows untranslated.
  const lang = segs[0] && HOME_LABEL[segs[0]] ? segs[0] : null;
  if (lang) segs = segs.length > 1 ? [segs[segs.length - 1]] : [];
  const homeHref = lang ? `/${lang}` : "/";
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-white/55 mb-5">
      <Link href={homeHref} className="hover:text-white">{homeLabel || (lang ? HOME_LABEL[lang] : "Home")}</Link>
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
        {data.showBreadcrumb !== false && <Breadcrumb current={data.title} homeLabel={data.homeLabel} />}
        {data.icon && <IconBadge name={data.icon} size="lg" className="mb-5" />}
        {orderElements(block.elements, {
          badge: <>{data.badge && <span className="sc-eyebrow mb-3"><InlineText blockId={block.id} field="badge" value={data.badge} /></span>}</>,
          title: <Title block={block} size="text-4xl sm:text-5xl lg:text-[4.2rem] max-w-3xl" />,
          description: <>
          {data.description && (
            <p className="text-lg text-white/75 leading-relaxed max-w-2xl mt-4 mb-8">
              <InlineText blockId={block.id} field="description" value={data.description} />
            </p>
          )}
          </>,
          buttons: <Buttons data={data} blockId={block.id} />,
        })}
      </div>
    </section>
  );
}
