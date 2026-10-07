import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Shared pieces for the "Boutique" variant family (services image-tiles,
 * cta banner-top / editorial, text intro / story-card / media, testimonials
 * avatar-cards, features framed-cards / outline-row, footer boutique).
 * Styling lives in globals.css (.bq-*). Colours default to the theme;
 * data.colors.accent / data.colors.dark override buttons and text.
 */
export type BoutiqueColors = { dark?: string; accent?: string };

export function bqStyle(colors?: BoutiqueColors, extra?: React.CSSProperties): React.CSSProperties {
  const s: Record<string, string> = {};
  if (colors?.accent) s["--bq-accent"] = colors.accent;
  if (colors?.dark) s["--bq-ink"] = colors.dark;
  return { ...s, ...extra } as React.CSSProperties;
}

export const isExternalUrl = (url?: string) => !!url && /^https?:\/\//.test(url);

export function BqLink({ href, className, style, children, ariaLabel }: { href: string; className?: string; style?: React.CSSProperties; children: React.ReactNode; ariaLabel?: string }) {
  return isExternalUrl(href)
    ? <a href={href} className={className} style={style} target="_blank" rel="noopener noreferrer" aria-label={ariaLabel}>{children}</a>
    : <Link href={href} className={className} style={style} aria-label={ariaLabel}>{children}</Link>;
}

/** Eyebrow + title (+ subtitle) used across the family. */
export function BqHeading({ eyebrow, title, subtitle, align = "center", upper = true, className, titleSize = 26 }: {
  eyebrow?: string; title?: string; subtitle?: string; align?: "center" | "left"; upper?: boolean; className?: string; titleSize?: number;
}) {
  if (!eyebrow && !title && !subtitle) return null;
  return (
    <div className={cn(align === "center" ? "text-center" : "text-left", className)}>
      {eyebrow && <span className="bq-eyebrow mb-3">{eyebrow}</span>}
      {title && <h2 className={cn("bq-h m-0", upper && "bq-upper")} style={{ fontSize: titleSize }}>{title}</h2>}
      {subtitle && <p className="mt-4 text-[16px] font-medium">{subtitle}</p>}
    </div>
  );
}
