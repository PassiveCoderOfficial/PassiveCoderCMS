import React from "react";
import { orderElements } from "@/components/blocks/_primitives/ordered-elements";
import type { BlockElements } from "@/types/cms";
import type { CTABlockProps } from "@/types/cms";
import { CTAProBand } from "./cta-pro";
import Image from "@/components/ui/smart-image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { InlineText } from "../inline-text";
import { InlineLabel } from "../inline-label";
import { ctaLabelField } from "./cta-label-field";
import { CTAVisitMap } from "./cta-visit-map";
import { CTABoutiqueBanner } from "./cta-boutique";

/** Per-button colour override (e.g. WhatsApp green); the design's own colours when unset. */
function btnStyle(b: { bgColor?: string; textColor?: string }): React.CSSProperties | undefined {
  if (!b.bgColor && !b.textColor) return undefined;
  return { backgroundColor: b.bgColor || undefined, color: b.textColor || (b.bgColor ? "#ffffff" : undefined), borderColor: b.bgColor || undefined };
}

// centered: the button row follows a centred banner. On phones the buttons
// stack at one shared width, centred on the card; from sm up they sit side by
// side, centred. Left/split layouts keep the original left-aligned row.
function CTAButtons({ data, dark, centered, blockId }: { data: CTABlockProps["data"]; dark?: boolean; centered?: boolean; blockId?: string }) {
  const { primaryButton, secondaryButton, tertiaryButton } = data;
  if (!primaryButton && !secondaryButton && !tertiaryButton?.label) return null;
  const sideBtn = (b: NonNullable<CTABlockProps["data"]["secondaryButton"]>, btn: "secondaryButton" | "tertiaryButton") => (
    <Link
      href={b.url}
      className="inline-flex items-center justify-center text-center px-7 py-3.5 border-2 border-current font-semibold rounded-lg hover:bg-white/10 transition-all text-sm"
      style={btnStyle(b)}
    >
      <InlineLabel blockId={blockId} field={ctaLabelField(data, btn)} value={b.label} />
    </Link>
  );
  return (
    <div className={cn(
      "flex gap-3",
      centered
        ? "flex-col items-stretch w-full max-w-xs mx-auto sm:max-w-none sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-center"
        : "flex-wrap",
    )}>
      {primaryButton && (
        <Link
          href={primaryButton.url}
          className={cn(
            "inline-flex items-center justify-center text-center px-7 py-3.5 font-semibold rounded-lg transition-all text-sm",
            dark
              ? "bg-white text-slate-900 hover:bg-slate-100"
              : "bg-primary text-primary-foreground hover:opacity-90",
          )}
          style={btnStyle(primaryButton)}
        >
          <InlineLabel blockId={blockId} field="primaryButton.label" value={primaryButton.label} />
        </Link>
      )}
      {secondaryButton && sideBtn(secondaryButton, "secondaryButton")}
      {tertiaryButton?.label && sideBtn(tertiaryButton, "tertiaryButton")}
    </div>
  );
}

/** Relative luminance of a #hex colour (0 dark .. 1 light); null when not hex. */
function hexLuminance(c?: string): number | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec((c ?? "").trim());
  if (!m) return null;
  const h = m[1].length === 3 ? m[1].split("").map((x) => x + x).join("") : m[1];
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// data.layout ("centered" default / "left" / "split") switches every banner
// variant between a centered stack and a side-by-side text+buttons split —
// each variant keeps its own color/shape, only the arrangement changes.
// "left" and "split" render the same split arrangement (no separate
// left-aligned-but-stacked layout exists for these banners).

// ─── Variant: gradient-banner ─────────────────────────────────────────────────
// Primary gradient background — cleaning / agency
function CTAGradientBanner({ data, blockId, elements }: { data: CTABlockProps["data"]; blockId: string; elements?: BlockElements }) {
  const isSplit = data.layout === "left" || data.layout === "split";
  const darkText = data.tone === "dark";
  return (
    <div className={cn(
      "relative max-w-5xl mx-auto rounded-[1.75rem] px-8 py-14 sm:py-16 shadow-xl overflow-hidden",
      darkText ? "text-slate-900" : "text-white",
      isSplit ? "flex flex-col md:flex-row items-center justify-between gap-8" : "text-center",
    )} style={{ backgroundImage: "var(--brand-gradient, linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 100%))" }}>
      {/* Decorative warm glow circles — echoes the footer's accent glow */}
      <div aria-hidden className="pointer-events-none absolute -top-16 -left-10 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-20 -right-16 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
      <div className={cn("relative", isSplit ? "max-w-xl" : undefined)}>
        {orderElements(elements, {
          title: <><h2 className="text-3xl md:text-4xl font-bold mb-3" style={{ fontFamily: "var(--heading-font, inherit)" }}><InlineText blockId={blockId} field="title" value={data.title} /></h2></>,
          description: <>{data.description && <p className={cn(darkText ? "text-slate-700" : "text-white/85", "text-lg", isSplit ? "mb-0" : "mb-8 max-w-2xl mx-auto")}><InlineText blockId={blockId} field="description" value={data.description} /></p>}</>,
        })}
      </div>
      <div className={cn("relative flex gap-4 flex-wrap", isSplit ? "shrink-0" : "justify-center")}>
        {!elements?.hidden?.includes("buttons") && <CTAButtons data={data} dark={!darkText} centered={!isSplit} blockId={blockId} />}
      </div>
    </div>
  );
}

// ─── Variant: dark-split ─────────────────────────────────────────────────────
// Dark card — luxury
function CTADarkSplit({ data, blockId, elements }: { data: CTABlockProps["data"]; blockId: string; elements?: BlockElements }) {
  const isCentered = data.layout === "centered" || !data.layout;
  return (
    <div className={cn(
      "max-w-6xl mx-auto bg-card border border-border rounded-xl px-10 py-10",
      isCentered ? "text-center flex flex-col items-center gap-6" : "flex flex-col md:flex-row items-center justify-between gap-8",
    )}>
      <div className={isCentered ? "max-w-2xl" : "max-w-xl"}>
        {orderElements(elements, {
          title: <><h2 className="text-2xl md:text-3xl font-light tracking-wide"><InlineText blockId={blockId} field="title" value={data.title} /></h2></>,
          description: <>{data.description && <p className="text-muted-foreground mt-3 text-sm leading-relaxed"><InlineText blockId={blockId} field="description" value={data.description} /></p>}</>,
        })}
      </div>
      <div className={cn("shrink-0", isCentered && "w-full sm:w-auto")}>
        {!elements?.hidden?.includes("buttons") && <CTAButtons data={data} centered={isCentered} blockId={blockId} />}
      </div>
    </div>
  );
}

// ─── Variant: navy-banner ──────────────────────────────────────────────────────
// Solid navy, serif feel — law firm
function CTANavyBanner({ data, blockId, elements }: { data: CTABlockProps["data"]; blockId: string; elements?: BlockElements }) {
  const isCentered = data.layout === "centered" || !data.layout;
  const darkText = data.tone === "dark";
  return (
    <div className={cn(
      "max-w-5xl mx-auto bg-primary rounded-none px-10 py-14",
      darkText ? "text-slate-900" : "text-primary-foreground",
      isCentered ? "text-center flex flex-col items-center gap-6" : "flex flex-col md:flex-row items-center justify-between gap-8",
    )}>
      <div className={isCentered ? "max-w-2xl" : undefined}>
        {orderElements(elements, {
          title: <><h2 className="text-3xl font-bold mb-2"><InlineText blockId={blockId} field="title" value={data.title} /></h2></>,
          description: <>{data.description && <p className={cn(darkText ? "text-slate-700" : "text-primary-foreground/80", "max-w-xl text-sm leading-relaxed")}><InlineText blockId={blockId} field="description" value={data.description} /></p>}</>,
        })}
      </div>
      <div className={cn("shrink-0", isCentered && "w-full sm:w-auto")}>
        {!elements?.hidden?.includes("buttons") && <CTAButtons data={data} dark={!darkText} centered={isCentered} blockId={blockId} />}
      </div>
    </div>
  );
}

// ─── Variant: warm-banner ─────────────────────────────────────────────────────
// Warm amber tones — restaurant
function CTAWarmBanner({ data, blockId, elements }: { data: CTABlockProps["data"]; blockId: string; elements?: BlockElements }) {
  const isSplit = data.layout === "left" || data.layout === "split";
  return (
    <div className={cn(
      // Solid card + tint (not a see-through tint): the card has to stay
      // readable when the section behind it is dark, e.g. the CTA default.
      "max-w-4xl mx-auto bg-card text-card-foreground bg-[linear-gradient(hsl(var(--primary)/0.10),hsl(var(--primary)/0.10))] border border-primary/20 rounded-xl px-8 py-12",
      isSplit ? "flex flex-col md:flex-row items-center justify-between gap-8" : "text-center",
    )}>
      <div className={isSplit ? "max-w-xl" : undefined}>
        {orderElements(elements, {
          title: <><h2 className="text-3xl font-bold italic mb-3"><InlineText blockId={blockId} field="title" value={data.title} /></h2></>,
          description: <>{data.description && <p className={cn("text-muted-foreground text-sm leading-relaxed", !isSplit && "mb-8 max-w-xl mx-auto")}><InlineText blockId={blockId} field="description" value={data.description} /></p>}</>,
        })}
      </div>
      <div className={cn("shrink-0", !isSplit && "w-full flex justify-center")}>
        {!elements?.hidden?.includes("buttons") && <CTAButtons data={data} centered={!isSplit} blockId={blockId} />}
      </div>
    </div>
  );
}

// ─── Variant: orange-banner ────────────────────────────────────────────────────
// Solid orange, bold uppercase — gym
function CTAOrangeBanner({ data, blockId, elements }: { data: CTABlockProps["data"]; blockId: string; elements?: BlockElements }) {
  const isCentered = data.layout === "centered" || !data.layout;
  const darkText = data.tone === "dark";
  return (
    <div className={cn("max-w-6xl mx-auto cta-section bg-gradient-to-r from-primary to-secondary rounded-none px-8 py-12", darkText ? "text-slate-900" : "text-white")}>
      <div className={cn("flex flex-col gap-6", isCentered ? "items-center text-center" : "md:flex-row items-center justify-between gap-6")}>
        <div>
          {orderElements(elements, {
            title: <><h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight"><InlineText blockId={blockId} field="title" value={data.title} /></h2></>,
            description: <>{data.description && <p className={cn(darkText ? "text-slate-700" : "text-white/80", "mt-2 text-sm")}><InlineText blockId={blockId} field="description" value={data.description} /></p>}</>,
          })}
        </div>
        <div className={cn("shrink-0", isCentered && "w-full sm:w-auto")}>
          {!elements?.hidden?.includes("buttons") && <CTAButtons data={data} dark={!darkText} centered={isCentered} blockId={blockId} />}
        </div>
      </div>
    </div>
  );
}

// ─── Legacy fallback ──────────────────────────────────────────────────────────

function CTALegacy({ block }: { block: CTABlockProps }) {
  const { data } = block;
  const { title, description, layout } = data;
  const elements = block.elements;
  // Light text by default (the block was made for coloured strips). On a pale
  // background colour (or tone "dark") it switches to dark text so it stays readable.
  // Auto only when the editor has not set a section text colour (Style tab).
  const lum = block.background?.type === "color" && !block.style?.textColor ? hexLuminance(block.background.color) : null;
  const darkText = data.tone ? data.tone === "dark" : lum !== null && lum > 0.72;
  return (
    <div className={cn("max-w-5xl mx-auto", layout === "split" && "flex items-center justify-between gap-8 flex-wrap")}>
      <div className={cn("flex flex-col gap-3", layout !== "split" && "text-center items-center")}>
        {orderElements(elements, {
          title: <><h2 className={cn("text-3xl md:text-4xl font-bold", darkText ? "text-slate-900" : "text-white")}><InlineText blockId={block.id} field="title" value={title} /></h2></>,
          description: <>{description && <p className={cn("text-lg max-w-xl", darkText ? "text-slate-700" : "text-white/80")}><InlineText blockId={block.id} field="description" value={description} /></p>}</>,
        })}
      </div>
      {!elements?.hidden?.includes("buttons") && (data.primaryButton || data.secondaryButton || data.tertiaryButton?.label) && (
        <div className={cn("flex gap-3 flex-wrap", layout !== "split" && "justify-center mt-4")}>
          {data.primaryButton && (
            <Link href={data.primaryButton.url} style={btnStyle(data.primaryButton)} className={cn("inline-flex items-center px-6 py-3 font-semibold rounded-lg transition-colors", darkText ? "bg-slate-900 text-white hover:bg-slate-800" : "bg-white text-slate-900 hover:bg-slate-100")}>
              <InlineLabel blockId={block.id} field="primaryButton.label" value={data.primaryButton.label} />
            </Link>
          )}
          {[data.secondaryButton, data.tertiaryButton].map((b, i) => b && (i === 0 || b.label) ? (
            <Link key={i} href={b.url} style={btnStyle(b)} className={cn("inline-flex items-center px-6 py-3 border-2 font-semibold rounded-lg transition-colors", darkText ? "border-slate-900 text-slate-900 hover:bg-slate-900/10" : "border-white text-white hover:bg-white/10")}>
              <InlineLabel blockId={block.id} field={ctaLabelField(data, i === 0 ? "secondaryButton" : "tertiaryButton")} value={b.label} />
            </Link>
          ) : null)}
        </div>
      )}
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function CTABlock({ block: raw }: { block: CTABlockProps }) {
  // Booking toggle: the Book button takes the second button slot, which every
  // variant already renders, so no variant needs its own booking code.
  const block: CTABlockProps = raw.data.showBooking
    ? { ...raw, data: { ...raw.data, secondaryButton: { label: raw.data.bookingLabel || "Book now", url: raw.data.bookingUrl || "/book" } } }
    : raw;
  const variant = block.templateVariant;
  if (variant === "visit-map") return <CTAVisitMap block={block} />;
  if (variant === "pro-band") return <CTAProBand block={block} />;
  if (variant === "boutique-banner") return <CTABoutiqueBanner data={block.data} blockId={block.id} />;
  if (variant === "gradient-banner") return <CTAGradientBanner data={block.data} blockId={block.id} elements={block.elements} />;
  if (variant === "dark-split") return <CTADarkSplit data={block.data} blockId={block.id} elements={block.elements} />;
  if (variant === "navy-banner") return <CTANavyBanner data={block.data} blockId={block.id} elements={block.elements} />;
  if (variant === "warm-banner") return <CTAWarmBanner data={block.data} blockId={block.id} elements={block.elements} />;
  if (variant === "orange-banner") return <CTAOrangeBanner data={block.data} blockId={block.id} elements={block.elements} />;
  return <CTALegacy block={block} />;
}
