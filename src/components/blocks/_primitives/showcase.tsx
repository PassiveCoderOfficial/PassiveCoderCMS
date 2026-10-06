import React from "react";
import { cn } from "@/lib/utils";

/**
 * Building blocks for the "showcase" family of variants (pricing spec-cards,
 * hero spec-card / page-banner, services bento / photo-cards, features
 * overview / numbered-dark / image-stats, gallery feature-strip, cta visit-map,
 * option preview). Styling lives in globals.css (.sc-*), colours default to
 * the theme and can be overridden per block with ShowcaseColors.
 */
export type ShowcaseColors = { dark?: string; accent?: string };

export function scStyle(colors?: ShowcaseColors, extra?: React.CSSProperties): React.CSSProperties {
  const s: Record<string, string> = {};
  if (colors?.dark) s["--sc-dark"] = colors.dark;
  if (colors?.accent) s["--sc-accent"] = colors.accent;
  return { ...s, ...extra } as React.CSSProperties;
}

export function ScHeading({ eyebrow, title, subtitle, onDark, align = "center", className }: {
  eyebrow?: string; title?: string; subtitle?: string; onDark?: boolean; align?: "center" | "left"; className?: string;
}) {
  if (!eyebrow && !title && !subtitle) return null;
  return (
    <div data-reveal className={cn("max-w-3xl mb-12", align === "center" ? "mx-auto text-center" : "", className)}>
      {eyebrow && <span className="sc-eyebrow mb-3">{eyebrow}</span>}
      {title && <h2 className={cn("text-3xl sm:text-4xl lg:text-[2.8rem] font-extrabold leading-[1.08] tracking-tight text-balance", onDark ? "text-white" : "text-foreground")}>{title}</h2>}
      {subtitle && <p className={cn("mt-4 text-base sm:text-lg leading-relaxed text-pretty", onDark ? "text-white/70" : "text-muted-foreground")}>{subtitle}</p>}
    </div>
  );
}

/** Label + percentage drawn as a bar. value is 0-100. */
export function ScMeter({ label, value, onDark, compact }: { label: string; value: number; onDark?: boolean; compact?: boolean }) {
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  if (compact) {
    return (
      <div className={cn("grid grid-cols-[2.6rem_1fr_2.8rem] items-center gap-2.5 text-[13px]", onDark ? "text-white/70" : "text-muted-foreground")}>
        <span className="truncate">{label}</span>
        <div className="sc-meter-track"><div className="sc-meter-fill" style={{ width: `${v}%` }} /></div>
        <b className={cn("text-right", onDark ? "text-white" : "text-foreground")}>{v}%</b>
      </div>
    );
  }
  return (
    <div>
      <div className={cn("flex justify-between text-sm mb-2", onDark ? "text-white/70" : "text-muted-foreground")}>
        <span>{label}</span><strong className={onDark ? "text-white" : "text-foreground"}>{v}%</strong>
      </div>
      <div className="sc-meter-track h-2"><div className="sc-meter-fill" style={{ width: `${v}%` }} /></div>
    </div>
  );
}

export const WaIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 32 32" className={className} fill="currentColor" aria-hidden="true"><path d="M16 0C7.2 0 0 7.2 0 16c0 2.8.7 5.5 2 7.8L0 32l8.5-2A16 16 0 1 0 16 0zm7.3 19.3c-.4-.2-2.4-1.2-2.7-1.3-.4-.1-.6-.2-.9.2-.3.4-1 1.3-1.3 1.6-.2.3-.5.3-.9.1-.4-.2-1.7-.6-3.2-2-1.2-1-2-2.4-2.2-2.8-.2-.4 0-.6.2-.8l.6-.7c.2-.2.3-.4.4-.7.1-.3.1-.5 0-.7l-1.2-3c-.3-.8-.7-.7-.9-.7h-.8c-.3 0-.7.1-1.1.5-.4.4-1.4 1.4-1.4 3.3s1.4 3.9 1.6 4.1c.2.3 2.8 4.3 6.8 6 1 .4 1.7.7 2.3.8 1 .3 1.8.3 2.5.2.8-.1 2.4-1 2.7-1.9.3-.9.3-1.7.2-1.9-.1-.2-.4-.3-.8-.5z"/></svg>
);

/** True when a link should open in a new tab. */
export const isExternal = (url?: string) => !!url && /^https?:\/\//.test(url);
