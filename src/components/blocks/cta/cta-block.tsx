import React from "react";
import type { CTABlockProps } from "@/types/cms";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { InlineText } from "../inline-text";

function CTAButtons({ data, dark }: { data: CTABlockProps["data"]; dark?: boolean }) {
  const { primaryButton, secondaryButton } = data;
  if (!primaryButton && !secondaryButton) return null;
  return (
    <div className="flex gap-3 flex-wrap">
      {primaryButton && (
        <Link
          href={primaryButton.url}
          className={cn(
            "inline-flex items-center px-7 py-3.5 font-semibold rounded-lg transition-all text-sm",
            dark
              ? "bg-white text-gray-900 hover:bg-gray-100"
              : "bg-primary text-primary-foreground hover:opacity-90",
          )}
        >
          {primaryButton.label}
        </Link>
      )}
      {secondaryButton && (
        <Link
          href={secondaryButton.url}
          className="inline-flex items-center px-7 py-3.5 border-2 border-current font-semibold rounded-lg hover:bg-white/10 transition-all text-sm"
        >
          {secondaryButton.label}
        </Link>
      )}
    </div>
  );
}

// data.layout ("centered" default / "left" / "split") switches every banner
// variant between a centered stack and a side-by-side text+buttons split —
// each variant keeps its own color/shape, only the arrangement changes.
// "left" and "split" render the same split arrangement (no separate
// left-aligned-but-stacked layout exists for these banners).

// ─── Variant: gradient-banner ─────────────────────────────────────────────────
// Primary gradient background — cleaning / agency
function CTAGradientBanner({ data, blockId }: { data: CTABlockProps["data"]; blockId: string }) {
  const isSplit = data.layout === "left" || data.layout === "split";
  return (
    <div className={cn(
      "max-w-5xl mx-auto rounded-2xl px-8 py-14 text-white shadow-xl",
      isSplit ? "flex flex-col md:flex-row items-center justify-between gap-8" : "text-center",
    )} style={{ backgroundImage: "var(--brand-gradient, linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 100%))" }}>
      <div className={isSplit ? "max-w-xl" : undefined}>
        <h2 className="text-3xl md:text-4xl font-bold mb-3"><InlineText blockId={blockId} field="title" value={data.title} /></h2>
        {data.description && <p className={cn("text-white/80 text-lg", isSplit ? "mb-0" : "mb-8 max-w-2xl mx-auto")}><InlineText blockId={blockId} field="description" value={data.description} /></p>}
      </div>
      <div className={cn("flex gap-4 flex-wrap", isSplit ? "shrink-0" : "justify-center")}>
        <CTAButtons data={data} dark />
      </div>
    </div>
  );
}

// ─── Variant: dark-split ─────────────────────────────────────────────────────
// Dark card — luxury
function CTADarkSplit({ data, blockId }: { data: CTABlockProps["data"]; blockId: string }) {
  const isCentered = data.layout === "centered" || !data.layout;
  return (
    <div className={cn(
      "max-w-6xl mx-auto bg-card border border-border rounded-xl px-10 py-10",
      isCentered ? "text-center flex flex-col items-center gap-6" : "flex flex-col md:flex-row items-center justify-between gap-8",
    )}>
      <div className={isCentered ? "max-w-2xl" : "max-w-xl"}>
        <h2 className="text-2xl md:text-3xl font-light tracking-wide"><InlineText blockId={blockId} field="title" value={data.title} /></h2>
        {data.description && <p className="text-muted-foreground mt-3 text-sm leading-relaxed"><InlineText blockId={blockId} field="description" value={data.description} /></p>}
      </div>
      <div className="shrink-0">
        <CTAButtons data={data} />
      </div>
    </div>
  );
}

// ─── Variant: navy-banner ──────────────────────────────────────────────────────
// Solid navy, serif feel — law firm
function CTANavyBanner({ data, blockId }: { data: CTABlockProps["data"]; blockId: string }) {
  const isCentered = data.layout === "centered" || !data.layout;
  return (
    <div className={cn(
      "max-w-5xl mx-auto bg-primary rounded-none px-10 py-14 text-primary-foreground",
      isCentered ? "text-center flex flex-col items-center gap-6" : "flex flex-col md:flex-row items-center justify-between gap-8",
    )}>
      <div className={isCentered ? "max-w-2xl" : undefined}>
        <h2 className="text-3xl font-bold mb-2"><InlineText blockId={blockId} field="title" value={data.title} /></h2>
        {data.description && <p className="text-primary-foreground/80 max-w-xl text-sm leading-relaxed"><InlineText blockId={blockId} field="description" value={data.description} /></p>}
      </div>
      <div className="shrink-0">
        <CTAButtons data={data} dark />
      </div>
    </div>
  );
}

// ─── Variant: warm-banner ─────────────────────────────────────────────────────
// Warm amber tones — restaurant
function CTAWarmBanner({ data, blockId }: { data: CTABlockProps["data"]; blockId: string }) {
  const isSplit = data.layout === "left" || data.layout === "split";
  return (
    <div className={cn(
      "max-w-4xl mx-auto bg-primary/10 border border-primary/20 rounded-xl px-8 py-12",
      isSplit ? "flex flex-col md:flex-row items-center justify-between gap-8" : "text-center",
    )}>
      <div className={isSplit ? "max-w-xl" : undefined}>
        <h2 className="text-3xl font-bold italic mb-3"><InlineText blockId={blockId} field="title" value={data.title} /></h2>
        {data.description && <p className={cn("text-muted-foreground text-sm leading-relaxed", !isSplit && "mb-8 max-w-xl mx-auto")}><InlineText blockId={blockId} field="description" value={data.description} /></p>}
      </div>
      <div className="shrink-0">
        <CTAButtons data={data} />
      </div>
    </div>
  );
}

// ─── Variant: orange-banner ────────────────────────────────────────────────────
// Solid orange, bold uppercase — gym
function CTAOrangeBanner({ data, blockId }: { data: CTABlockProps["data"]; blockId: string }) {
  const isCentered = data.layout === "centered" || !data.layout;
  return (
    <div className="max-w-6xl mx-auto cta-section bg-gradient-to-r from-primary to-secondary rounded-none px-8 py-12 text-white">
      <div className={cn("flex flex-col gap-6", isCentered ? "items-center text-center" : "md:flex-row items-center justify-between gap-6")}>
        <div>
          <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight"><InlineText blockId={blockId} field="title" value={data.title} /></h2>
          {data.description && <p className="text-white/80 mt-2 text-sm"><InlineText blockId={blockId} field="description" value={data.description} /></p>}
        </div>
        <div className="shrink-0">
          <CTAButtons data={data} dark />
        </div>
      </div>
    </div>
  );
}

// ─── Legacy fallback ──────────────────────────────────────────────────────────

function CTALegacy({ block }: { block: CTABlockProps }) {
  const { data } = block;
  const { title, description, layout } = data;
  return (
    <div className={cn("max-w-5xl mx-auto", layout === "split" && "flex items-center justify-between gap-8 flex-wrap")}>
      <div className={cn("flex flex-col gap-3", layout !== "split" && "text-center items-center")}>
        <h2 className="text-3xl md:text-4xl font-bold text-white"><InlineText blockId={block.id} field="title" value={title} /></h2>
        {description && <p className="text-white/80 text-lg max-w-xl"><InlineText blockId={block.id} field="description" value={description} /></p>}
      </div>
      {(data.primaryButton || data.secondaryButton) && (
        <div className={cn("flex gap-3 flex-wrap", layout !== "split" && "justify-center mt-4")}>
          {data.primaryButton && (
            <Link href={data.primaryButton.url} className="inline-flex items-center px-6 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors">
              {data.primaryButton.label}
            </Link>
          )}
          {data.secondaryButton && (
            <Link href={data.secondaryButton.url} className="inline-flex items-center px-6 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-colors">
              {data.secondaryButton.label}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function CTABlock({ block }: { block: CTABlockProps }) {
  const variant = block.templateVariant;
  if (variant === "gradient-banner") return <CTAGradientBanner data={block.data} blockId={block.id} />;
  if (variant === "dark-split") return <CTADarkSplit data={block.data} blockId={block.id} />;
  if (variant === "navy-banner") return <CTANavyBanner data={block.data} blockId={block.id} />;
  if (variant === "warm-banner") return <CTAWarmBanner data={block.data} blockId={block.id} />;
  if (variant === "orange-banner") return <CTAOrangeBanner data={block.data} blockId={block.id} />;
  return <CTALegacy block={block} />;
}
