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

function badgeStyle(data: HeroBlockProps["data"]): React.CSSProperties | undefined {
  if (!data.badgeBgColor && !data.badgeTextColor) return undefined;
  return { backgroundColor: data.badgeBgColor || undefined, color: data.badgeTextColor || undefined, borderColor: data.badgeTextColor || undefined };
}

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
            primaryButton.bgColor
              ? "hover:opacity-90 shadow-lg"
              : primaryButton.variant === "outline"
              ? "border-2 border-current hover:bg-white/10"
              : primaryButton.variant === "secondary"
              ? "bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm"
              : "bg-primary text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/30",
          )}
          style={primaryButton.bgColor ? { backgroundColor: primaryButton.bgColor, color: primaryButton.textColor } : undefined}
        >
          {primaryButton.label}
        </Link>
      )}
      {secondaryButton && (
        <Link
          href={secondaryButton.url}
          className={cn(
            "inline-flex items-center justify-center rounded-lg px-7 py-3.5 text-sm font-medium transition-all",
            secondaryButton.bgColor
              ? "hover:bg-white/10"
              : secondaryButton.variant === "outline"
              ? "border-2 border-current hover:bg-white/10"
              : secondaryButton.variant === "secondary"
              ? "bg-white/10 hover:bg-white/20"
              : "bg-transparent border-2 border-primary text-primary hover:bg-primary/10",
          )}
          style={secondaryButton.bgColor
            ? { backgroundColor: secondaryButton.bgColor, color: secondaryButton.textColor, border: `2px solid ${secondaryButton.textColor}` }
            : undefined}
        >
          {secondaryButton.label}
        </Link>
      )}
    </div>
  );
}

// ─── Variant: split-image-right ──────────────────────────────────────────────
// Text + badge pill on one side, image on the other, clean bright layout.
// data.layout controls which side the image sits on (and whether it shows at
// all) — "right" (default) / "left" swap column order, "split" is the same as
// "right", "centered" drops the image column and centers the text.
function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const num = parseInt(full, 16);
  const r = (num >> 16) & 255, g = (num >> 8) & 255, b = num & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

function HeroSplitImageRight({ block }: HeroBlockComponentProps) {
  const { data } = block;
  const titleSize = titleSizeMap[data.typography?.titleSize] ?? "text-5xl md:text-6xl";
  const isCentered = data.layout === "centered";
  const imageFirst = data.layout === "left";

  const textContent = (
    <div className={cn("flex flex-col gap-5", isCentered && "items-center text-center")}>
      {data.badge && (
        <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 rounded-full px-4 py-1.5 text-xs font-semibold w-fit" style={badgeStyle(data)}>
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
        <p className={cn("text-base leading-relaxed text-muted-foreground", !isCentered && "max-w-lg")} style={{ color: data.typography?.descColor || undefined }}>
          <InlineText blockId={block.id} field="description" value={data.description} />
        </p>
      )}
      <HeroButtons data={data} centered={isCentered} />
    </div>
  );

  if (isCentered) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        {textContent}
      </div>
    );
  }

  return (
    <div className={cn("max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center min-h-[70vh] py-8")}>
      {imageFirst && data.imageUrl && (
        <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-[4/3] lg:aspect-[5/4] order-first lg:order-none">
          <Image src={data.imageUrl} alt={data.imageAlt ?? data.title} fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
        </div>
      )}
      {textContent}
      {!imageFirst && data.imageUrl && (
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

// data.layout positions the text block within the full-bleed image: "left" /
// "right" pin it to that edge, "centered" / "split" (default) keep it centered.
function HeroFullscreenOverlay({ block }: HeroBlockComponentProps) {
  const { data } = block;
  const titleSize = titleSizeMap[data.typography?.titleSize] ?? "text-5xl md:text-7xl";
  const opacity = data.overlayOpacity ?? 0.55;
  const overlayFrom = hexToRgba(data.overlayColor ?? "#000000", opacity);
  const overlayTo = data.overlayColorTo ? hexToRgba(data.overlayColorTo, opacity) : overlayFrom;
  const isLeft = data.layout === "left";
  const isRight = data.layout === "right";
  const isPinned = isLeft || isRight;
  return (
    <div className={cn("relative min-h-[90vh] flex items-center overflow-hidden", isPinned ? (isLeft ? "justify-start" : "justify-end") : "justify-center")}>
      {data.imageUrl && (
        <Image src={data.imageUrl} alt={data.imageAlt ?? data.title} fill className="object-cover" priority />
      )}
      <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${overlayFrom}, ${overlayTo})` }} />
      {/* Subtle bottom-anchored gradient for text legibility without muddying
          the whole image — lighter than a full black wash. */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
      <div className={cn(
        "relative z-10 max-w-4xl mx-6 px-6 flex flex-col gap-6",
        isPinned ? "items-start text-left" : "mx-auto text-center items-center",
      )}>
        {data.badge && (
          <span className="inline-flex items-center gap-1.5 border border-white/30 backdrop-blur-sm text-white/90 rounded-full px-5 py-2 text-xs font-semibold tracking-widest uppercase" style={badgeStyle(data)}>
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
        <HeroButtons data={data} centered={!isPinned} />
      </div>
    </div>
  );
}

// ─── Variant: centered-bold ───────────────────────────────────────────────────
// Centred, very large text, optional bg accent pill — law, finance, authority.
// Single-column by design (no image split) — data.layout intentionally does
// not apply here; the settings panel hides the Layout control for this variant.
function HeroCenteredBold({ block }: HeroBlockComponentProps) {
  const { data } = block;
  const titleSize = titleSizeMap[data.typography?.titleSize] ?? "text-5xl md:text-7xl";
  return (
    <div className="max-w-5xl mx-auto text-center flex flex-col items-center gap-6 py-12">
      {data.badge && (
        <span className="inline-flex items-center gap-1.5 bg-secondary/20 text-secondary border border-secondary/30 rounded-full px-5 py-2 text-xs font-semibold tracking-widest uppercase" style={badgeStyle(data)}>
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
// Text over a dark gradient with a full-bleed background image — agencies.
// data.layout controls which side the text panel sits on: "left" (default) /
// "right" flips the gradient + text alignment, "centered" centers the text
// column instead of pinning it to an edge.
function HeroDarkGradientLeft({ block }: HeroBlockComponentProps) {
  const { data } = block;
  const titleSize = titleSizeMap[data.typography?.titleSize] ?? "text-5xl md:text-7xl";
  const isRight = data.layout === "right";
  const isCentered = data.layout === "centered";
  const gradientDir = isCentered ? "bg-gradient-to-t" : isRight ? "bg-gradient-to-l" : "bg-gradient-to-r";

  return (
    <div className="relative min-h-[80vh] flex items-center overflow-hidden">
      {data.imageUrl && (
        <>
          <Image src={data.imageUrl} alt={data.imageAlt ?? data.title} fill className="object-cover" priority />
          <div className={cn("absolute inset-0 from-background via-background/95 to-background/10", gradientDir)} />
        </>
      )}
      <div className={cn(
        "relative z-10 max-w-7xl mx-auto w-full px-6",
        isCentered && "flex justify-center text-center",
        isRight && "flex justify-end text-right",
      )}>
        <div className={cn("max-w-xl flex flex-col gap-6", isCentered && "items-center", isRight && "items-end")}>
          {data.badge && (
            <span className="inline-flex items-center gap-1.5 bg-primary/20 text-primary border border-primary/30 rounded-full px-4 py-1.5 text-xs font-semibold tracking-widest w-fit" style={badgeStyle(data)}>
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
          <HeroButtons data={data} centered={isCentered} />
        </div>
      </div>
    </div>
  );
}

// ─── Variant: corporate ───────────────────────────────────────────────────────
// Full-bleed image, diagonal brand-color gradient, subtle grid texture, centered
// content with a bordered badge — used for manufacturing/B2B/corporate templates.
// Single-column by design — data.layout intentionally does not apply here; the
// settings panel hides the Layout control for this variant.
function HeroCorporate({ block }: HeroBlockComponentProps) {
  const { data } = block;
  const titleSize = titleSizeMap[data.typography?.titleSize] ?? "text-5xl";
  // overlayColor/overlayColorTo are always literal hex (seeded from the
  // template palette) — hexToRgba needs a real hex, not a CSS var() reference.
  const from = data.overlayColor ?? "#1a5c38";
  const to = data.overlayColorTo ?? "#0f2418";
  return (
    <div className="relative overflow-hidden min-h-[520px] flex items-center justify-center">
      {data.imageUrl && (
        <Image src={data.imageUrl} alt={data.imageAlt ?? data.title} fill className="object-cover" priority />
      )}
      <div
        className="absolute inset-0"
        style={{ background: `linear-gradient(135deg, ${hexToRgba(from, 0.94)} 0%, ${hexToRgba(to, 0.82)} 60%, ${hexToRgba(from, 0.8)} 100%)` }}
      />
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)", backgroundSize: "40px 40px" }}
      />
      <div className="relative z-10 max-w-4xl mx-auto px-10 py-24 text-center flex flex-col items-center gap-5">
        {data.badge && (
          <span className="inline-flex items-center gap-2 border border-white/30 text-white/90 text-xs font-medium px-4 py-2 rounded-sm uppercase tracking-widest" style={badgeStyle(data)}>
            <InlineText blockId={block.id} field="badge" value={data.badge} />
          </span>
        )}
        <h1 className={cn("font-bold text-white leading-tight tracking-tight", titleSize)}>
          <InlineText blockId={block.id} field="title" value={data.title} />
        </h1>
        {data.subtitle && (
          <p className="text-white/65 text-base leading-relaxed max-w-2xl">
            <InlineText blockId={block.id} field="subtitle" value={data.subtitle} />
          </p>
        )}
        {data.description && (
          <p className="text-white/60 text-sm leading-relaxed max-w-2xl">
            <InlineText blockId={block.id} field="description" value={data.description} />
          </p>
        )}
        <HeroButtons data={data} centered />
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
        <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium w-fit" style={badgeStyle(data)}>
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
  if (variant === "corporate") return <HeroCorporate block={block} />;
  return <HeroLegacy block={block} />;
}
