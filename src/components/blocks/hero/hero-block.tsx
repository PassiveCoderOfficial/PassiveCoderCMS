import React from "react";
import type { HeroBlockProps } from "@/types/cms";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface HeroBlockComponentProps {
  block: HeroBlockProps;
}

export function HeroBlock({ block }: HeroBlockComponentProps) {
  const { data } = block;
  const { layout, badge, title, subtitle, description, primaryButton, secondaryButton, imageUrl, imageAlt, typography } = data;

  const titleSizeMap: Record<string, string> = {
    "3xl": "text-3xl",
    "4xl": "text-4xl",
    "5xl": "text-5xl md:text-6xl",
    "6xl": "text-5xl md:text-7xl",
    "7xl": "text-6xl md:text-8xl",
  };

  const titleSize = titleSizeMap[typography.titleSize] ?? "text-5xl md:text-6xl";

  const textContent = (
    <div className={cn(layout === "centered" && "text-center items-center", "flex flex-col gap-4")}>
      {badge && (
        <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium w-fit">
          {badge}
        </span>
      )}
      <h1 className={cn("font-bold tracking-tight leading-tight", titleSize)} style={{ color: typography.titleColor }}>
        {title}
      </h1>
      {subtitle && (
        <p className="text-xl font-medium" style={{ color: typography.subtitleColor }}>
          {subtitle}
        </p>
      )}
      {description && (
        <p className="text-base leading-relaxed max-w-2xl" style={{ color: typography.descColor }}>
          {description}
        </p>
      )}
      {(primaryButton || secondaryButton) && (
        <div className={cn("flex flex-wrap gap-3 mt-2", layout === "centered" && "justify-center")}>
          {primaryButton && (
            <Link
              href={primaryButton.url}
              className={cn(
                "inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-medium transition-colors",
                primaryButton.variant === "outline"
                  ? "border-2 border-current hover:bg-gray-100"
                  : primaryButton.variant === "secondary"
                  ? "bg-gray-100 text-gray-900 hover:bg-gray-200"
                  : "bg-gray-900 text-white hover:bg-gray-700",
              )}
            >
              {primaryButton.label}
            </Link>
          )}
          {secondaryButton && (
            <Link
              href={secondaryButton.url}
              className={cn(
                "inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-medium transition-colors",
                secondaryButton.variant === "outline"
                  ? "border-2 border-current hover:bg-gray-100"
                  : secondaryButton.variant === "secondary"
                  ? "bg-gray-100 text-gray-900 hover:bg-gray-200"
                  : "bg-gray-900 text-white hover:bg-gray-700",
              )}
            >
              {secondaryButton.label}
            </Link>
          )}
        </div>
      )}
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
