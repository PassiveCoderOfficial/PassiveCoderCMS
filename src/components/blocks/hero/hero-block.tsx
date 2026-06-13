import React from "react";
import type { HeroBlockProps } from "@/types/cms";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { InlineText } from "../inline-text";

interface HeroBlockComponentProps {
  block: HeroBlockProps;
}

const titleSizeMap: Record<string, string> = {
  "3xl": "text-3xl",
  "4xl": "text-4xl",
  "5xl": "text-5xl md:text-6xl",
  "6xl": "text-5xl md:text-7xl",
  "7xl": "text-6xl md:text-8xl",
};

function HeroButtons({ data, centered }: { data: HeroBlockProps["data"]; centered?: boolean }) {
  const { primaryButton, secondaryButton } = data;
  if (!primaryButton && !secondaryButton) return null;
  return (
    <div className={cn("flex flex-wrap gap-3 mt-2", centered && "justify-center")}>
      {primaryButton && (
        <Link
          href={primaryButton.url}
          className={cn(
            "inline-flex items-center justify-center rounded-lg px-7 py-3.5 text-sm font-semibold transition-all",
            primaryButton.variant === "outline"
              ? "border-2 border-current hover:bg-white/10"
              : primaryButton.variant === "secondary"
              ? "bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm"
              : "bg-primary text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/30",
          )}
        >
          {primaryButton.label}
        </Link>
      )}
      {secondaryButton && (
        <Link
          href={secondaryButton.url}
          className={cn(
            "inline-flex items-center justify-center rounded-lg px-7 py-3.5 text-sm font-medium transition-all",
            secondaryButton.variant === "outline"
              ? "border-2 border-current hover:bg-white/10"
              : secondaryButton.variant === "secondary"
              ? "bg-white/10 hover:bg-white/20"
              : "bg-transparent border-2 border-primary text-primary hover:bg-primary/10",
          )}
        >
          {secondaryButton.label}
        </Link>
      )}
    </div>
  );
}

// ─── Variant: split-image-right ──────────────────────────────────────────────
// Image on right, text on left, badge pill, clean bright layout
function HeroSplitImageRight({ block }: HeroBlockComponentProps) {
  const { data } = block;
  const titleSize = titleSizeMap[data.typography?.titleSize] ?? "text-5xl md:text-6xl";
  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center min-h-[70vh] py-8">
      <div className="flex flex-col gap-5">
        {data.badge && (
          <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 rounded-full px-4 py-1.5 text-xs font-semibold w-fit">
            <InlineText blockId={block.id} field="badge" value={data.badge} />
          </span>
        )}
        <h1 className={cn("font-bold tracking-tight leading-[1.1]", titleSize)} style={{ color: data.typography?.titleColor || undefined }}>
          <InlineText blockId={block.id} field="title" value={data.title} />
        </h1>
        {data.subtitle && (
          <p className="text-xl font-medium" style={{ color: data.typography?.subtitleColor || undefined }}>
            <InlineText blockId={block.id} field="subtitle" value={data.subtitle} />
          </p>
        )}
        {data.description && (
          <p className="text-base leading-relaxed text-muted-foreground max-w-lg" style={{ color: data.typography?.descColor || undefined }}>
            <InlineText blockId={block.id} field="description" value={data.description} />
          </p>
        )}
        <HeroButtons data={data} />
      </div>
      {data.imageUrl && (
        <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-[4/3] lg:aspect-[5/4]">
          <Image src={data.imageUrl} alt={data.imageAlt ?? data.title} fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
        </div>
      )}
    </div>
  );
}

// ─── Variant: fullscreen-overlay ─────────────────────────────────────────────
// Full viewport background image with text overlay — used for spa, restaurant, gym
function HeroFullscreenOverlay({ block }: HeroBlockComponentProps) {
  const { data } = block;
  const titleSize = titleSizeMap[data.typography?.titleSize] ?? "text-5xl md:text-7xl";
  const opacity = data.overlayOpacity ?? 0.55;
  return (
    <div className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {data.imageUrl && (
        <Image src={data.imageUrl} alt={data.imageAlt ?? data.title} fill className="object-cover" priority />
      )}
      <div className="absolute inset-0" style={{ background: `rgba(0,0,0,${opacity})` }} />
      {/* Subtle gradient for readability at bottom */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
      <div className="relative z-10 max-w-4xl mx-auto text-center px-6 flex flex-col items-center gap-6">
        {data.badge && (
          <span className="inline-flex items-center gap-1.5 border border-white/30 backdrop-blur-sm text-white/90 rounded-full px-5 py-2 text-xs font-semibold tracking-widest uppercase">
            <InlineText blockId={block.id} field="badge" value={data.badge} />
          </span>
        )}
        <h1 className={cn("font-bold tracking-tight leading-[1.05] text-white", titleSize)}>
          <InlineText blockId={block.id} field="title" value={data.title} />
        </h1>
        {data.subtitle && (
          <p className="text-xl text-white/80 font-light max-w-2xl">
            <InlineText blockId={block.id} field="subtitle" value={data.subtitle} />
          </p>
        )}
        {data.description && (
          <p className="text-base text-white/70 max-w-xl leading-relaxed">
            <InlineText blockId={block.id} field="description" value={data.description} />
          </p>
        )}
        <HeroButtons data={data} centered />
      </div>
    </div>
  );
}

// ─── Variant: centered-bold ───────────────────────────────────────────────────
// Centred, very large text, optional bg accent pill — law, finance, authority
function HeroCenteredBold({ block }: HeroBlockComponentProps) {
  const { data } = block;
  const titleSize = titleSizeMap[data.typography?.titleSize] ?? "text-5xl md:text-7xl";
  return (
    <div className="max-w-5xl mx-auto text-center flex flex-col items-center gap-6 py-12">
      {data.badge && (
        <span className="inline-flex items-center gap-1.5 bg-secondary/20 text-secondary border border-secondary/30 rounded-full px-5 py-2 text-xs font-semibold tracking-widest uppercase">
          <InlineText blockId={block.id} field="badge" value={data.badge} />
        </span>
      )}
      <h1 className={cn("font-bold tracking-tight leading-[1.05]", titleSize)} style={{ color: data.typography?.titleColor || undefined }}>
        <InlineText blockId={block.id} field="title" value={data.title} />
      </h1>
      {data.subtitle && (
        <p className="text-xl font-medium text-muted-foreground max-w-2xl" style={{ color: data.typography?.subtitleColor || undefined }}>
          <InlineText blockId={block.id} field="subtitle" value={data.subtitle} />
        </p>
      )}
      {data.description && (
        <p className="text-base leading-relaxed text-muted-foreground max-w-2xl" style={{ color: data.typography?.descColor || undefined }}>
          <InlineText blockId={block.id} field="description" value={data.description} />
        </p>
      )}
      <HeroButtons data={data} centered />
      {data.imageUrl && (
        <div className="relative w-full mt-8 rounded-xl overflow-hidden shadow-2xl aspect-video">
          <Image src={data.imageUrl} alt={data.imageAlt ?? data.title} fill className="object-cover" priority />
        </div>
      )}
    </div>
  );
}

// ─── Variant: dark-gradient-left ─────────────────────────────────────────────
// Text on left half over dark gradient, image fills right — agencies
function HeroDarkGradientLeft({ block }: HeroBlockComponentProps) {
  const { data } = block;
  const titleSize = titleSizeMap[data.typography?.titleSize] ?? "text-5xl md:text-7xl";
  return (
    <div className="relative min-h-[80vh] flex items-center overflow-hidden">
      {data.imageUrl && (
        <>
          <Image src={data.imageUrl} alt={data.imageAlt ?? data.title} fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/10" />
        </>
      )}
      <div className="relative z-10 max-w-7xl mx-auto w-full px-6">
        <div className="max-w-xl flex flex-col gap-6">
          {data.badge && (
            <span className="inline-flex items-center gap-1.5 bg-primary/20 text-primary border border-primary/30 rounded-full px-4 py-1.5 text-xs font-semibold tracking-widest w-fit">
              <InlineText blockId={block.id} field="badge" value={data.badge} />
            </span>
          )}
          <h1 className={cn("font-black tracking-tight leading-[1.05]", titleSize)} style={{ color: data.typography?.titleColor || undefined }}>
            <InlineText blockId={block.id} field="title" value={data.title} />
          </h1>
          {data.subtitle && (
            <p className="text-lg text-muted-foreground" style={{ color: data.typography?.subtitleColor || undefined }}>
              <InlineText blockId={block.id} field="subtitle" value={data.subtitle} />
            </p>
          )}
          {data.description && (
            <p className="text-sm text-muted-foreground leading-relaxed" style={{ color: data.typography?.descColor || undefined }}>
              <InlineText blockId={block.id} field="description" value={data.description} />
            </p>
          )}
          <HeroButtons data={data} />
        </div>
      </div>
    </div>
  );
}

// ─── Legacy layouts (used when no templateVariant) ────────────────────────────
function HeroLegacy({ block }: HeroBlockComponentProps) {
  const { data } = block;
  const { layout, badge, title, subtitle, description, imageUrl, imageAlt, typography } = data;
  const titleSize = titleSizeMap[typography.titleSize] ?? "text-5xl md:text-6xl";

  const textContent = (
    <div className={cn(layout === "centered" && "text-center items-center", "flex flex-col gap-4")}>
      {badge && (
        <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium w-fit">
          <InlineText blockId={block.id} field="badge" value={badge} />
        </span>
      )}
      <h1 className={cn("font-bold tracking-tight leading-tight", titleSize)} style={{ color: typography.titleColor }}>
        <InlineText blockId={block.id} field="title" value={title} />
      </h1>
      {subtitle && <p className="text-xl font-medium" style={{ color: typography.subtitleColor }}><InlineText blockId={block.id} field="subtitle" value={subtitle} /></p>}
      {description && <p className="text-base leading-relaxed max-w-2xl" style={{ color: typography.descColor }}><InlineText blockId={block.id} field="description" value={description} /></p>}
      <HeroButtons data={data} centered={layout === "centered"} />
    </div>
  );

  if (layout === "centered") {
    return (
      <div className="max-w-5xl mx-auto text-center py-8">
        {textContent}
        {imageUrl && (
          <div className="relative mt-10 rounded-xl overflow-hidden shadow-2xl aspect-video">
            <Image src={imageUrl} alt={imageAlt ?? title} fill className="object-cover" />
          </div>
        )}
      </div>
    );
  }
  if (layout === "split" || layout === "right") {
    return (
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div>{textContent}</div>
        {imageUrl && (
          <div className="relative aspect-square rounded-2xl overflow-hidden shadow-xl">
            <Image src={imageUrl} alt={imageAlt ?? title} fill className="object-cover" />
          </div>
        )}
      </div>
    );
  }
  if (layout === "left") {
    return (
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        {imageUrl && (
          <div className="relative aspect-square rounded-2xl overflow-hidden shadow-xl order-first md:order-none">
            <Image src={imageUrl} alt={imageAlt ?? title} fill className="object-cover" />
          </div>
        )}
        <div>{textContent}</div>
      </div>
    );
  }
  return <div className="max-w-5xl mx-auto">{textContent}</div>;
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function HeroBlock({ block }: HeroBlockComponentProps) {
  const variant = block.templateVariant;
  if (variant === "split-image-right") return <HeroSplitImageRight block={block} />;
  if (variant === "fullscreen-overlay") return <HeroFullscreenOverlay block={block} />;
  if (variant === "centered-bold") return <HeroCenteredBold block={block} />;
  if (variant === "dark-gradient-left") return <HeroDarkGradientLeft block={block} />;
  return <HeroLegacy block={block} />;
}
